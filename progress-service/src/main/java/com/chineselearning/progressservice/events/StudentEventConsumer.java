package com.chineselearning.progressservice.events;

import com.chineselearning.progressservice.domain.StudentReplica;
import com.chineselearning.progressservice.domain.dao.IStudentReplicaDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * RabbitMQ event consumer for student-related events from User Service.
 * Maintains a local replica of student identity data in Progress Service.
 *
 * Pattern: Event-Driven Architecture with eventual consistency.
 */
@Service
public class StudentEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(StudentEventConsumer.class);

    private final IStudentReplicaDao studentReplicaDao;

    public StudentEventConsumer(IStudentReplicaDao studentReplicaDao) {
        this.studentReplicaDao = studentReplicaDao;
    }

    /**
     * Listen to StudentCreatedEvent from User Service.
     * Create a local replica of the student.
     *
     * @param event StudentCreatedEvent containing student ID, name, and email
     */
    @RabbitListener(queues = "${rabbitmq.queue.student-created}")
    @Transactional
    public void handleStudentCreated(StudentCreatedEvent event) {
        log.info("Received StudentCreatedEvent: {}", event);

        try {
            // Check if student already exists (idempotency - prevent duplicates)
            if (studentReplicaDao.existsByStudentId(event.getStudentId())) {
                log.warn("Student with ID {} already exists in replica. Skipping creation.", event.getStudentId());
                return;
            }

            // Create new student replica
            StudentReplica replica = new StudentReplica();
            replica.setStudentId(event.getStudentId());
            replica.setFullName(event.getFullName());
            replica.setEmail(event.getEmail());
            replica.setSyncedAt(LocalDateTime.now());

            studentReplicaDao.save(replica);
            log.info("Successfully created StudentReplica for studentId={}", event.getStudentId());

        } catch (Exception e) {
            log.error("Failed to handle StudentCreatedEvent for studentId={}: {}",
                    event.getStudentId(), e.getMessage(), e);
            // In production: send to dead-letter queue or retry mechanism
            throw e; // Trigger RabbitMQ retry
        }
    }

    /**
     * Listen to StudentUpdatedEvent from User Service.
     * Update the local replica with new student data.
     *
     * @param event StudentUpdatedEvent containing updated student data
     */
    @RabbitListener(queues = "${rabbitmq.queue.student-updated}")
    @Transactional
    public void handleStudentUpdated(StudentUpdatedEvent event) {
        log.info("Received StudentUpdatedEvent: {}", event);

        try {
            StudentReplica replica = studentReplicaDao.findById(event.getStudentId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "StudentReplica not found for studentId=" + event.getStudentId()));

            // Update fields
            replica.setFullName(event.getFullName());
            replica.setEmail(event.getEmail());
            replica.setSyncedAt(LocalDateTime.now());

            studentReplicaDao.save(replica);
            log.info("Successfully updated StudentReplica for studentId={}", event.getStudentId());

        } catch (Exception e) {
            log.error("Failed to handle StudentUpdatedEvent for studentId={}: {}",
                    event.getStudentId(), e.getMessage(), e);
            throw e; // Trigger RabbitMQ retry
        }
    }

    /**
     * Listen to StudentDeletedEvent from User Service.
     * Delete the local replica (or soft-delete if preferred).
     *
     * @param event StudentDeletedEvent containing student ID
     */
    @RabbitListener(queues = "${rabbitmq.queue.student-deleted}")
    @Transactional
    public void handleStudentDeleted(StudentDeletedEvent event) {
        log.info("Received StudentDeletedEvent: {}", event);

        try {
            if (!studentReplicaDao.existsByStudentId(event.getStudentId())) {
                log.warn("StudentReplica with ID {} not found. Already deleted or never existed.",
                        event.getStudentId());
                return;
            }

            // Hard delete (alternative: soft delete with deleted_at column)
            studentReplicaDao.deleteById(event.getStudentId());
            log.info("Successfully deleted StudentReplica for studentId={}", event.getStudentId());

            // Note: Exercise attempts and lesson progress are NOT deleted automatically
            // Decision: Keep historical data for analytics even if student is deleted

        } catch (Exception e) {
            log.error("Failed to handle StudentDeletedEvent for studentId={}: {}",
                    event.getStudentId(), e.getMessage(), e);
            throw e; // Trigger RabbitMQ retry
        }
    }
}