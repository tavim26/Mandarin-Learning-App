package com.chineselearning.chatbotservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService
{

    private static final String SYSTEM_PROMPT = """
            You are a friendly and patient Mandarin Chinese tutor.
            Your role is to practice Chinese conversation with the student.
            
            Rules:
            - Always respond with the Chinese text first, using simplified characters.
            - After the Chinese text, provide the Pinyin transliteration in parentheses.
            - Then provide a translation in the same language the student used to write to you.
            - If the student writes in Romanian, translate in Romanian. If in English, translate in English.
            - If the student asks for a grammar or vocabulary explanation, provide it clearly and concisely.
            - Adapt the complexity of your sentences to the student's perceived level.
            """;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();


    // Construieste request-ul catre Gemini cu system prompt + fereastra de context + mesajul curent
    public String chat(String userMessage, List<ContextMessage> contextHistory)
    {
        List<Map<String, Object>> contents = new ArrayList<>();

        // System prompt-ul este trimis ca primul mesaj de tip "user", urmat de un ack din partea modelului
        contents.add(buildContent("user", SYSTEM_PROMPT));
        contents.add(buildContent("model", "Understood. I will act as your Mandarin Chinese tutor."));

        // Adaugam fereastra de context in ordinea cronologica corecta
        for (ContextMessage ctx : contextHistory)
        {
            String role = "STUDENT".equals(ctx.sender()) ? "user" : "model";
            contents.add(buildContent(role, ctx.content()));
        }

        // Mesajul curent al studentului
        contents.add(buildContent("user", userMessage));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", contents);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            String urlWithKey = apiUrl + "?key=" + apiKey;

            ResponseEntity<Map> response = restTemplate.exchange(
                    urlWithKey,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            return extractTextFromResponse(response.getBody());

        } catch (Exception e) {
            throw new RuntimeException("Gemini API temporarily unavailable: " + e.getMessage());
        }
    }



    // Construieste un obiect "content" conform formatului Gemini API
    private Map<String, Object> buildContent(String role, String text)
    {
        Map<String, Object> part = new HashMap<>();
        part.put("text", text);

        Map<String, Object> content = new HashMap<>();
        content.put("role", role);
        content.put("parts", List.of(part));

        return content;
    }

    // Extrage textul din raspunsul JSON al Gemini
    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> responseBody)
    {
        if (responseBody == null || !responseBody.containsKey("candidates"))
        {
            throw new RuntimeException("Invalid response from Gemini API");
        }

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, String>> parts = (List<Map<String, String>>) content.get("parts");

        return parts.get(0).get("text");
    }

    // Record intern pentru transportul contextului din ChatService
    public record ContextMessage(String sender, String content) {}
}