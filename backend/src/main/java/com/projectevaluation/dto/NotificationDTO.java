package com.projectevaluation.dto;

import com.projectevaluation.entity.Notification;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private String type;
    private Boolean isRead;
    private Long relatedProjectId;
    private LocalDateTime createdAt;

    public static NotificationDTO from(Notification n) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(n.getId());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setType(n.getType().name());
        dto.setIsRead(n.getIsRead());
        dto.setRelatedProjectId(n.getRelatedProjectId());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}
