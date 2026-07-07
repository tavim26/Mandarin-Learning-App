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
        You are Lin, a friendly and patient Mandarin Chinese tutor.
        Your role is to help students practice Chinese conversation, build vocabulary, and understand grammar.
        Always be encouraging, even when correcting mistakes.
        
        ## Response format
        Every response must follow this exact structure, no exceptions:
        
        Chinese: <simplified characters>
        Pinyin: <pinyin with tone marks>
        Translation: <translation in the student's language>
        
        If the student writes in Romanian, translate in Romanian.
        If the student writes in English, translate in English.
        
        Example — student asks "How do you say good morning?":
        Chinese: 早上好！今天你好吗？
        Pinyin: Zǎoshang hǎo! Jīntiān nǐ hǎo ma?
        Translation: Good morning! How are you today?
        
        ## Student level
        - Infer the student's level from their messages.
        - Beginners (no Chinese used): short sentences, HSK 1-2 vocabulary only.
        - Intermediate (some Chinese used): HSK 3-4 vocabulary, introduce grammar points.
        - Advanced (fluent Chinese): natural conversation, complex structures allowed.
        - When unsure, start simple and adjust based on their responses.
        
        ## Error correction
        - If the student makes a mistake in Chinese, correct it gently before giving your response.
        - Show the corrected version first, then explain briefly what was wrong in one sentence.
        - Never ignore errors, but never correct more than one mistake per message — pick the most important one.
        
        ## Grammar and vocabulary explanations
        - When asked for an explanation, be concise and use simple terms.
        - Always include 1-2 example sentences for any new word or grammar point.
        - Mention the HSK level of new vocabulary when relevant.
        
        ## Rules
        - Always use simplified characters, never traditional.
        - Never skip the Pinyin — it is mandatory in every response.
        - Never provide the translation before the Chinese text.
        - Do not mix languages within the Chinese text itself.
        - Do not overwhelm the student — introduce at most one new grammar concept per response.
        """;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;

    public AiService(RestTemplate restTemplate)
    {
        this.restTemplate = restTemplate;
    }



    public String chat(String userMessage, List<ContextMessage> contextHistory, String customInstructions)
    {
        List<Map<String, Object>> contents = new ArrayList<>();


        String effectiveSystemPrompt = buildSystemPrompt(customInstructions);

        contents.add(buildContent("user", effectiveSystemPrompt));
        contents.add(buildContent("model", "Understood. I will act as your Mandarin Chinese tutor."));

        for (ContextMessage ctx : contextHistory)
        {
            String role = "STUDENT".equals(ctx.sender()) ? "user" : "model";
            contents.add(buildContent(role, ctx.content()));
        }

        contents.add(buildContent("user", userMessage));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", contents);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {

            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            return extractTextFromResponse(response.getBody());

        } catch (Exception e) {
            throw new RuntimeException("Gemini API temporarily unavailable: " + e.getMessage());
        }
    }


    private String buildSystemPrompt(String customInstructions)
    {
        StringBuilder prompt = new StringBuilder(SYSTEM_PROMPT);

        if (customInstructions != null && !customInstructions.isBlank())
        {
            prompt.append("\n\n---\n");
            prompt.append("The following are additional instructions set by the student for this session. ");
            prompt.append("Follow them as long as they do not contradict the core rules above:\n");
            prompt.append(customInstructions);
        }

        return prompt.toString();
    }




    private Map<String, Object> buildContent(String role, String text)
    {
        Map<String, Object> part = new HashMap<>();
        part.put("text", text);

        Map<String, Object> content = new HashMap<>();
        content.put("role", role);
        content.put("parts", List.of(part));

        return content;
    }


    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> responseBody)
    {
        if (responseBody == null || !responseBody.containsKey("candidates"))
        {
            throw new RuntimeException("Invalid response from Gemini API: missing candidates.", null);
        }

        List<Map<String, Object>> candidates =
                (List<Map<String, Object>>) responseBody.get("candidates");

        if (candidates == null || candidates.isEmpty())
        {
            throw new RuntimeException("Invalid response from Gemini API: empty candidates list.", null);
        }

        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        if (content == null)
        {
            throw new RuntimeException("Invalid response from Gemini API: missing content.", null);
        }

        List<Map<String, String>> parts = (List<Map<String, String>>) content.get("parts");
        if (parts == null || parts.isEmpty())
        {
            throw new RuntimeException("Invalid response from Gemini API: missing parts.", null);
        }

        String text = parts.get(0).get("text");
        if (text == null)
        {
            throw new RuntimeException("Invalid response from Gemini API: missing text.", null);
        }

        return text;
    }

    public record ContextMessage(String sender, String content) {}
}