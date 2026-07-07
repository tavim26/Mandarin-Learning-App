package com.chineselearning.apigateway.filter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.util.*;

public class MutableHttpServletRequest extends HttpServletRequestWrapper
{

    private final Map<String, String> customHeaders = new HashMap<>();
    private final Set<String> removedHeaders = new HashSet<>();

    public MutableHttpServletRequest(HttpServletRequest request)
    {
        super(request);
    }

    public void putHeader(String name, String value)
    {
        customHeaders.put(name, value);
    }


    @Override
    public String getHeader(String name)
    {
        if (removedHeaders.contains(name.toLowerCase()))
        {
            return null;
        }
        if (customHeaders.containsKey(name))
        {
            return customHeaders.get(name);
        }
        return super.getHeader(name);
    }

    @Override
    public Enumeration<String> getHeaderNames()
    {
        Set<String> names = new HashSet<>(customHeaders.keySet());
        Enumeration<String> original = super.getHeaderNames();

        while (original.hasMoreElements())
        {
            String name = original.nextElement();

            if (!removedHeaders.contains(name.toLowerCase()))
            {
                names.add(name);
            }
        }
        return Collections.enumeration(names);
    }

    @Override
    public Enumeration<String> getHeaders(String name)
    {
        if (removedHeaders.contains(name.toLowerCase()))
        {
            return Collections.enumeration(Collections.emptyList());
        }
        if (customHeaders.containsKey(name))
        {
            return Collections.enumeration(List.of(customHeaders.get(name)));
        }
        return super.getHeaders(name);
    }
}