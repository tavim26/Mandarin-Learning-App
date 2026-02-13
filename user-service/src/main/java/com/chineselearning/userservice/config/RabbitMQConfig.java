package com.chineselearning.userservice.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ configuration for User Service.
 * Declares the exchange for publishing student-related events to other microservices.
 *
 * Pattern: Topic Exchange with routing keys for different event types.
 * Consumer services (Progress, Flashcard, etc.) will bind their own queues to this exchange.
 */
@Configuration
public class RabbitMQConfig
{

    @Value("${rabbitmq.exchange.user-events}")
    private String userEventsExchange;

    /**
     * Declare the Topic Exchange for user events.
     * Topic exchanges route messages to queues based on routing key patterns.
     *
     */
    @Bean
    public TopicExchange userEventsExchange()
    {
        return new TopicExchange(userEventsExchange);
    }

    /**
     * Message converter for serializing/deserializing messages to/from JSON.
     * Allows sending Java objects directly without manual JSON conversion.
     *
     */
    @Bean
    public MessageConverter jsonMessageConverter()
    {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Configure RabbitTemplate with JSON message converter.
     * RabbitTemplate is the main Spring class for sending messages to RabbitMQ.
     *
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory)
    {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}