package com.projectevaluation.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageServiceImpl {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    @Value("${app.file.storage:local}")
    private String storage;

    @Value("${app.file.s3.endpoint:}")
    private String s3Endpoint;

    @Value("${app.file.s3.region:ap-south-1}")
    private String s3Region;

    @Value("${app.file.s3.access-key:}")
    private String s3AccessKey;

    @Value("${app.file.s3.secret-key:}")
    private String s3SecretKey;

    @Value("${app.file.s3.bucket:}")
    private String s3Bucket;

    private S3Client s3Client;

    @jakarta.annotation.PostConstruct
    void initializeS3Client() {
        if (!"s3".equalsIgnoreCase(storage)) {
            return;
        }
        if (s3Endpoint.isBlank() || s3AccessKey.isBlank() || s3SecretKey.isBlank() || s3Bucket.isBlank()) {
            throw new IllegalStateException(
                    "S3 storage is enabled but endpoint, access key, secret key, or bucket is missing");
        }
        s3Client = S3Client.builder()
                .endpointOverride(java.net.URI.create(s3Endpoint))
                .region(Region.of(s3Region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(s3AccessKey, s3SecretKey)))
                .forcePathStyle(true)
                .build();
    }

    /**
     * Store a file in the given subdirectory.
     * Returns the relative file path (relative to upload-dir).
     */
    public String storeFile(MultipartFile file, String subDir) {
        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf")) {
            throw new IllegalArgumentException("Only PDF files are allowed");
        }

        // Validate file size (10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 10MB");
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        String generatedFilename = timestamp + "_" + uniqueId + ".pdf";
        String objectKey = objectKey(subDir, generatedFilename);
        if ("s3".equalsIgnoreCase(storage)) {
            try {
                PutObjectRequest request = PutObjectRequest.builder()
                        .bucket(s3Bucket)
                        .key(objectKey)
                        .contentType(contentType)
                        .build();
                s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
                log.info("File stored in S3 bucket {}: {}", s3Bucket, objectKey);
                return objectKey;
            } catch (IOException | S3Exception ex) {
                log.error("Failed to store file in S3: {}", objectKey, ex);
                throw new RuntimeException("Failed to store file. Please try again.", ex);
            }
        }

        try {
            Path uploadPath = Paths.get(uploadDir, subDir);
            Files.createDirectories(uploadPath);

            Path filePath = uploadPath.resolve(generatedFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            log.info("File stored: {}", filePath.toAbsolutePath());
            return objectKey;
        } catch (IOException ex) {
            log.error("Failed to store file: ", ex);
            throw new RuntimeException("Failed to store file. Please try again.", ex);
        }
    }

    public Resource loadFileAsResource(String filePath) {
        if ("s3".equalsIgnoreCase(storage)) {
            try {
                GetObjectRequest request = GetObjectRequest.builder()
                        .bucket(s3Bucket)
                        .key(normalizeKey(filePath))
                        .build();
                ResponseBytes<?> response = s3Client.getObjectAsBytes(request);
                return new ByteArrayResource(response.asByteArray()) {
                    @Override
                    public String getFilename() {
                        return Paths.get(filePath).getFileName().toString();
                    }
                };
            } catch (S3Exception ex) {
                log.error("Failed to load file from S3: {}", filePath, ex);
                throw new RuntimeException("File not found or not readable: " + filePath, ex);
            }
        }

        Path resolvedPath = Paths.get(uploadDir).resolve(filePath).normalize();
        Resource resource = new org.springframework.core.io.FileSystemResource(resolvedPath);
        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("File not found or not readable: " + filePath);
        }
    }

    public void deleteFile(String filePath) {
        if ("s3".equalsIgnoreCase(storage)) {
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(s3Bucket)
                        .key(normalizeKey(filePath))
                        .build());
                log.info("File deleted from S3 bucket {}: {}", s3Bucket, filePath);
                return;
            } catch (S3Exception ex) {
                log.error("Failed to delete file from S3: {}", filePath, ex);
                throw new RuntimeException("Failed to delete file: " + filePath, ex);
            }
        }

        try {
            Path resolvedPath = Paths.get(uploadDir).resolve(filePath).normalize();
            Files.deleteIfExists(resolvedPath);
            log.info("File deleted: {}", resolvedPath.toAbsolutePath());
        } catch (IOException ex) {
            log.error("Failed to delete file: {}", filePath, ex);
            throw new RuntimeException("Failed to delete file: " + filePath, ex);
        }
    }

    private String objectKey(String subDir, String filename) {
        return normalizeKey(subDir + "/" + filename);
    }

    private String normalizeKey(String filePath) {
        String normalized = filePath.replace('\\', '/');
        if (normalized.startsWith("/") || normalized.contains("../") || normalized.equals("..")) {
            throw new IllegalArgumentException("Invalid file path");
        }
        return normalized;
    }

}
