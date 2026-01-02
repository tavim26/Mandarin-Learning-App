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
 * RabbitMQ pentru Progress Service .
 *
 * Pattern: Topic Exchange cu routing keys.
 * User Service publica evenimente -> Progress Service le consuma
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
     * Declara Topic Exchange (acelasi nume ca si exchange name-ul din User Service).
     */
    @Bean
    public TopicExchange userEventsExchange()
    {
        return new TopicExchange(userEventsExchange);
    }

    /**
     * declara coada pentru StudentCreatedEvent.
     */
    @Bean
    public Queue studentCreatedQueue() {
        return new Queue(studentCreatedQueue, true);
    }

    /**
     * declara coada pentru StudentDeletedEvent.
     */
    @Bean
    public Queue studentDeletedQueue() {
        return new Queue(studentDeletedQueue, true);
    }

    /**
     * Declara coada pentru StudentUpdatedEvent.
     */
    @Bean
    public Queue studentUpdatedQueue() {
        return new Queue(studentUpdatedQueue, true);
    }

    /**
     * Bind studentCreatedQueue spre exchange cu routing key "student.created".
     */
    @Bean
    public Binding studentCreatedBinding(Queue studentCreatedQueue, TopicExchange userEventsExchange) {
        return BindingBuilder.bind(studentCreatedQueue)
                .to(userEventsExchange)
                .with(studentCreatedRoutingKey);
    }

    /**
     * Bind studentDeletedQueue spre exchange cu routing key "student.deleted".
     */
    @Bean
    public Binding studentDeletedBinding(Queue studentDeletedQueue, TopicExchange userEventsExchange) {
        return BindingBuilder.bind(studentDeletedQueue)
                .to(userEventsExchange)
                .with(studentDeletedRoutingKey);
    }

    /**
     * Bind studentUpdatedQueue spre exchange cu routing key "student.updated".
     */
    @Bean
    public Binding studentUpdatedBinding(Queue studentUpdatedQueue, TopicExchange userEventsExchange) {
        return BindingBuilder.bind(studentUpdatedQueue)
                .to(userEventsExchange)
                .with(studentUpdatedRoutingKey);
    }

    /**
     * Message converter pentru a deserializa mesajele JSON spre obiecte Java.
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }


    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}