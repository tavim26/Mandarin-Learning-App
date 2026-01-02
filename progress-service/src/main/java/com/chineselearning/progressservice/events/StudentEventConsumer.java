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
 * RabbitMQ event consumer pentru event-uri legate de Student venite din User Service.
 *
 * Pattern: Event-Driven Architecture with eventual consistency.
 */
@Service
public class StudentEventConsumer
{

    private static final Logger log = LoggerFactory.getLogger(StudentEventConsumer.class);

    private final IStudentReplicaDao studentReplicaDao;

    public StudentEventConsumer(IStudentReplicaDao studentReplicaDao)
    {
        this.studentReplicaDao = studentReplicaDao;
    }


    @RabbitListener(queues = "${rabbitmq.queue.student-created}")
    @Transactional
    public void handleStudentCreated(StudentCreatedEvent event)
    {
        log.info("Received StudentCreatedEvent: {}", event);

        try {
            // verifica daca studentul exista deja
            if (studentReplicaDao.existsByStudentId(event.getStudentId()))
            {
                log.warn("Student with ID {} already exists in replica. Skipping creation.", event.getStudentId());
                return;
            }

            //creaza o replica a studentului
            StudentReplica replica = new StudentReplica();
            replica.setStudentId(event.getStudentId());
            replica.setFullName(event.getFullName());
            replica.setEmail(event.getEmail());
            replica.setSyncedAt(LocalDateTime.now());

            studentReplicaDao.save(replica);
            log.info("Successfully created StudentReplica for studentId={}", event.getStudentId());

        } catch (Exception e) {
            log.error("Failed to handle StudentCreatedEvent for studentId={}: {}", event.getStudentId(), e.getMessage(), e);
            throw e;
        }
    }


    @RabbitListener(queues = "${rabbitmq.queue.student-updated}")
    @Transactional
    public void handleStudentUpdated(StudentUpdatedEvent event)
    {
        log.info("Received StudentUpdatedEvent: {}", event);

        try {
            StudentReplica replica = studentReplicaDao.findById(event.getStudentId())
                    .orElseThrow(() -> new IllegalArgumentException("StudentReplica not found for studentId=" + event.getStudentId()));

            // Update
            replica.setFullName(event.getFullName());
            replica.setEmail(event.getEmail());
            replica.setSyncedAt(LocalDateTime.now());

            studentReplicaDao.save(replica);
            log.info("Successfully updated StudentReplica for studentId={}", event.getStudentId());

        } catch (Exception e) {
            log.error("Failed to handle StudentUpdatedEvent for studentId={}: {}", event.getStudentId(), e.getMessage(), e);
            throw e;
        }
    }


    @RabbitListener(queues = "${rabbitmq.queue.student-deleted}")
    @Transactional
    public void handleStudentDeleted(StudentDeletedEvent event)
    {
        log.info("Received StudentDeletedEvent: {}", event);

        try {
            if (!studentReplicaDao.existsByStudentId(event.getStudentId()))
            {
                log.warn("StudentReplica with ID {} not found. Already deleted or never existed.",
                        event.getStudentId());
                return;
            }


            studentReplicaDao.deleteById(event.getStudentId());
            log.info("Successfully deleted StudentReplica for studentId={}", event.getStudentId());

        } catch (Exception e) {
            log.error("Failed to handle StudentDeletedEvent for studentId={}: {}", event.getStudentId(), e.getMessage(), e);
            throw e;
        }
    }
}