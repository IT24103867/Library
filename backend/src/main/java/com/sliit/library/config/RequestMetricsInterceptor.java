package com.sliit.library.config;

import com.sliit.library.service.RequestMetricsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class RequestMetricsInterceptor implements HandlerInterceptor {

    private final RequestMetricsService requestMetricsService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Record the request
        requestMetricsService.recordRequest();
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // Record errors (HTTP status 400-599)
        if (response.getStatus() >= 400) {
            requestMetricsService.recordError();
        }
    }
}