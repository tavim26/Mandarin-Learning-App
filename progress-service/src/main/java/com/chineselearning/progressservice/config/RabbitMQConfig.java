package com.chineselearning.progressservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ configuration for Progress Service (Consumer).
 * Declares queues and bindings to consume student events from User Service.
 *
 * Pattern: Topic Exchange with routing keys.
 * User Service publishes events -> Progress Service consumes them.
 */
@Configuration
public class RabbitMQConfig {

    @Value("${rabbitmq.queue.student-created}")
    private String studentCreatedQueue;

    @Value("${rabbitmq.queue.student-deleted}")
    private String studentDeletedQueue;

    @Value("${rabbitmq.queue.student-updated}")
    private String studentUpdatedQueue;

    @Value("${rabbitmq.exchange.user-events}")
    private String userEventsExchange;

    @Value("${rabbitmq.routing-key.student-created}")
    private String studentCreatedRoutingKey;

    @Value("${rabbitmq.routing-key.student-deleted}")
    private String studentDeletedRoutingKey;

    @Value("${rabbitmq.routing-key.student-updated}")
    private String studentUpdatedRoutingKey;

    /**
     * Declare the Topic Exchange (must match User Service exchange name).
     * This exchange already exists in User Service, but declaring it here is idempotent.
     */
    @Bean
    public TopicExchange userEventsExchange() {
        return new TopicExchange(userEventsExchange);
    }

    /**
     * Declare queue for StudentCreatedEvent.
     * Durable queue persists messages even if RabbitMQ restarts.
     */
    @Bean
    public Queue studentCreatedQueue() {
        return new Queue(studentCreatedQueue, true);
    }

    /**
     * Declare queue for StudentDeletedEvent.
     */
    @Bean
    public Queue studentDeletedQueue() {
        return new Queue(studentDeletedQueue, true);
    }

    /**
     * Declare queue for StudentUpdatedEvent.
     */
    @Bean
    public Queue studentUpdatedQueue() {
        return new Queue(studentUpdatedQueue, true);
    }

    /**
     * Bind studentCreatedQueue to exchange with routing key "student.created".
     */
    @Bean
    public Binding studentCreatedBinding(Queue studentCreatedQueue, TopicExchange userEventsExchange) {
        return BindingBuilder.bind(studentCreatedQueue)
                .to(userEventsExchange)
                .with(studentCreatedRoutingKey);
    }

    /**
     * Bind studentDeletedQueue to exchange with routing key "student.deleted".
     */
    @Bean
    public Binding studentDeletedBinding(Queue studentDeletedQueue, TopicExchange userEventsExchange) {
        return BindingBuilder.bind(studentDeletedQueue)
                .to(userEventsExchange)
                .with(studentDeletedRoutingKey);
    }

    /**
     * Bind studentUpdatedQueue to exchange with routing key "student.updated".
     */
    @Bean
    public Binding studentUpdatedBinding(Queue studentUpdatedQueue, TopicExchange userEventsExchange) {
        return BindingBuilder.bind(studentUpdatedQueue)
                .to(userEventsExchange)
                .with(studentUpdatedRoutingKey);
    }

    /**
     * Message converter for deserializing JSON messages to Java objects.
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Configure RabbitTemplate with JSON message converter.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}