package com.chineselearning.userservice.service;

import com.chineselearning.userservice.events.StudentCreatedEvent;
import com.chineselearning.userservice.events.StudentDeletedEvent;
import com.chineselearning.userservice.events.StudentUpdatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service responsible for publishing student-related events to RabbitMQ.
 * This decouples User Service from other microservices via async messaging.
 *
 * Other services (Progress, Flashcard, Group) will listen to these events
 * and maintain their own local replica of student data.
 */
@Service
public class StudentEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(StudentEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange.user-events}")
    private String exchange;

    @Value("${rabbitmq.routing-key.student-created}")
    private String studentCreatedRoutingKey;

    @Value("${rabbitmq.routing-key.student-deleted}")
    private String studentDeletedRoutingKey;

    @Value("${rabbitmq.routing-key.student-updated}")
    private String studentUpdatedRoutingKey;

    public StudentEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Publish StudentCreatedEvent to RabbitMQ exchange.
     *
     * @param event StudentCreatedEvent containing student ID, name, and email
     */
    public void publishStudentCreated(StudentCreatedEvent event) {
        try {
            rabbitTemplate.convertAndSend(exchange, studentCreatedRoutingKey, event);
            log.info("Published StudentCreatedEvent: {}", event);
        } catch (Exception e) {
            log.error("Failed to publish StudentCreatedEvent for studentId={}: {}",
                    event.getStudentId(), e.getMessage(), e);
            // In production: retry logic or dead-letter queue
        }
    }

    /**
     * Publish StudentDeletedEvent to RabbitMQ exchange.
     *
     * @param event StudentDeletedEvent containing student ID
     */
    public void publishStudentDeleted(StudentDeletedEvent event) {
        try {
            rabbitTemplate.convertAndSend(exchange, studentDeletedRoutingKey, event);
            log.info("Published StudentDeletedEvent: {}", event);
        } catch (Exception e) {
            log.error("Failed to publish StudentDeletedEvent for studentId={}: {}",
                    event.getStudentId(), e.getMessage(), e);
        }
    }

    /**
     * Publish StudentUpdatedEvent to RabbitMQ exchange.
     *
     * @param event StudentUpdatedEvent containing updated student data
     */
    public void publishStudentUpdated(StudentUpdatedEvent event) {
        try {
            rabbitTemplate.convertAndSend(exchange, studentUpdatedRoutingKey, event);
            log.info("Published StudentUpdatedEvent: {}", event);
        } catch (Exception e) {
            log.error("Failed to publish StudentUpdatedEvent for studentId={}: {}",
                    event.getStudentId(), e.getMessage(), e);
        }
    }
}