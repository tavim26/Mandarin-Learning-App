package com.chineselearning.apigateway.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Order(2)
public class AuthorizationFilter extends OncePerRequestFilter {

    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/register",
            "/api/auth/login"
    );

    // Servicii complet inaccesibile pentru TEACHER
    private static final List<String> STUDENT_ONLY_PREFIXES = List.of(
            "/api/flashcards/",
            "/api/analysis/",
            "/api/chatbot/"
    );

    // Endpoint-uri ADMIN only
    private static final List<RouteRule> ADMIN_ONLY_ROUTES = List.of(
            new RouteRule(HttpMethod.POST,   "/api/content/units"),
            new RouteRule(HttpMethod.PUT,    "/api/content/units/"),
            new RouteRule(HttpMethod.DELETE, "/api/content/units/"),
            new RouteRule(HttpMethod.POST,   "/api/content/lessons"),
            new RouteRule(HttpMethod.PUT,    "/api/content/lessons/"),
            new RouteRule(HttpMethod.DELETE, "/api/content/lessons/"),
            new RouteRule(HttpMethod.POST,   "/api/content/exercises"),
            new RouteRule(HttpMethod.PUT,    "/api/content/exercises/"),
            new RouteRule(HttpMethod.DELETE, "/api/content/exercises/"),
            new RouteRule(HttpMethod.POST,   "/api/content/materials"),
            new RouteRule(HttpMethod.DELETE, "/api/content/materials/"),
            new RouteRule(HttpMethod.POST,   "/api/users"),
            new RouteRule(HttpMethod.GET,    "/api/users"),
            new RouteRule(HttpMethod.PUT,    "/api/users/"),
            new RouteRule(HttpMethod.DELETE, "/api/users/"),
            new RouteRule(HttpMethod.GET,    "/api/progress/students/admin/all")
    );

    // Pattern-uri pentru verificarea "own" — {studentId} sau {userId} din path
    private static final List<Pattern> OWN_RESOURCE_PATTERNS = List.of(
            Pattern.compile("^/api/flashcards/sets/student/(\\d+).*$"),
            Pattern.compile("^/api/progress/students/(\\d+).*$"),
            Pattern.compile("^/api/progress/lessons/student/(\\d+).*$"),
            Pattern.compile("^/api/progress/attempts/student/(\\d+).*$"),
            Pattern.compile("^/api/analysis/student/(\\d+).*$"),
            Pattern.compile("^/api/users/students/(\\d+).*$"),
            Pattern.compile("^/api/users/teachers/(\\d+).*$")
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String role = request.getHeader("X-User-Role");
        String userIdHeader = request.getHeader("X-User-Id");
        String path = request.getRequestURI();
        HttpMethod method = HttpMethod.valueOf(request.getMethod());

        if (role == null || userIdHeader == null) {
            sendForbidden(response, "Date de autentificare lipsa");
            return;
        }

        // ADMIN are acces la tot
        if ("ADMIN".equals(role)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Verifica daca TEACHER incearca sa acceseze servicii exclusive STUDENT
        if ("TEACHER".equals(role)) {
            boolean blockedForTeacher = STUDENT_ONLY_PREFIXES.stream()
                    .anyMatch(path::startsWith);
            if (blockedForTeacher) {
                sendForbidden(response, "Acces interzis pentru rolul TEACHER");
                return;
            }
        }

        // Verifica endpoint-urile ADMIN only
        boolean isAdminOnly = ADMIN_ONLY_ROUTES.stream()
                .anyMatch(rule -> rule.matches(method, path));
        if (isAdminOnly) {
            sendForbidden(response, "Acces interzis — necesita rol ADMIN");
            return;
        }

        // Verifica "own" — studentul/userul poate accesa doar propriile resurse
        if ("STUDENT".equals(role) || "TEACHER".equals(role)) {
            for (Pattern pattern : OWN_RESOURCE_PATTERNS) {
                Matcher matcher = pattern.matcher(path);
                if (matcher.matches()) {
                    Long resourceUserId = Long.parseLong(matcher.group(1));
                    Long authenticatedUserId = Long.parseLong(userIdHeader);
                    if (!resourceUserId.equals(authenticatedUserId)) {
                        sendForbidden(response, "Acces interzis — resursa apartine altui utilizator");
                        return;
                    }
                    break;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private void sendForbidden(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }

    // Clasa interna pentru definirea regulilor de ruta
    private record RouteRule(HttpMethod method, String pathPrefix) {
        boolean matches(HttpMethod requestMethod, String requestPath) {
            return this.method.equals(requestMethod) && requestPath.startsWith(this.pathPrefix);
        }
    }
}