package com.projectevaluation.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageServiceImpl {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

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

        try {
            Path uploadPath = Paths.get(uploadDir, subDir);
            Files.createDirectories(uploadPath);

            // Generate safe server-side filename
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String uniqueId = UUID.randomUUID().toString().substring(0, 8);
            String safeFilename = timestamp + "_" + uniqueId + ".pdf";

            Path filePath = uploadPath.resolve(safeFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            log.info("File stored: {}", filePath.toAbsolutePath());
            return subDir + "/" + safeFilename;
        } catch (IOException ex) {
            log.error("Failed to store file: ", ex);
            throw new RuntimeException("Failed to store file. Please try again.", ex);
        }
    }

    public Resource loadFileAsResource(String filePath) {
        try {
            Path resolvedPath = Paths.get(uploadDir).resolve(filePath).normalize();
            Resource resource = new UrlResource(resolvedPath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found or not readable: " + filePath);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File path is invalid: " + filePath, ex);
        }
    }

    public void deleteFile(String filePath) {
        try {
            Path resolvedPath = Paths.get(uploadDir).resolve(filePath).normalize();
            Files.deleteIfExists(resolvedPath);
            log.info("File deleted: {}", resolvedPath.toAbsolutePath());
        } catch (IOException ex) {
            log.error("Failed to delete file: {}", filePath, ex);
        }
    }
}
