package com.projectevaluation.service.impl;

import com.projectevaluation.entity.*;
import com.projectevaluation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void sendNotification(User user, String title, String message,
                                  Notification.NotificationType type, Long relatedProjectId) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .relatedProjectId(relatedProjectId)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }
}
