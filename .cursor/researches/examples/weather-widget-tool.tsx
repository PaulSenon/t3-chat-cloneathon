// Example: Weather Widget Tool Implementation
// This demonstrates the basic pattern for rich widget streaming

import React from "react";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { useChat } from "@ai-sdk/react";

// 1. Server-side tool definition (app/api/chat/route.ts)
export const weatherTool = {
  displayWeather: {
    description: "Display weather information with a rich interactive card",
    parameters: z.object({
      city: z.string().describe("City name"),
      latitude: z.number().describe("Latitude coordinate"),
      longitude: z.number().describe("Longitude coordinate"),
      units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
    }),
    execute: async ({ city, latitude, longitude, units }) => {
      try {
        // Call weather API (replace with your preferred service)
        const weatherData = await getWeatherData({
          latitude,
          longitude,
          units,
        });

        // Return structured data (NOT JSX)
        return {
          city,
          temperature: weatherData.temperature,
          condition: weatherData.condition,
          humidity: weatherData.humidity,
          windSpeed: weatherData.windSpeed,
          forecast: weatherData.forecast, // 5-day forecast
          lastUpdated: new Date().toISOString(),
          units,
        };
      } catch (error) {
        console.error("Weather fetch failed:", error);
        // Return error data for graceful UI handling
        return {
          city,
          error: "Failed to fetch weather data",
          lastUpdated: new Date().toISOString(),
        };
      }
    },
  },
};

// 2. Client-side component (components/widgets/weather-card.tsx)
interface WeatherCardProps {
  city: string;
  temperature?: number;
  condition?: string;
  humidity?: number;
  windSpeed?: number;
  forecast?: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
  }>;
  units?: "celsius" | "fahrenheit";
  error?: string;
  lastUpdated: string;
  className?: string;
}

export function WeatherCard({
  city,
  temperature,
  condition,
  humidity,
  windSpeed,
  forecast = [],
  units = "celsius",
  error,
  lastUpdated,
  className,
}: WeatherCardProps) {
  if (error) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
      >
        <h3 className="text-lg font-semibold text-red-800">Weather Error</h3>
        <p className="text-red-600">{error}</p>
        <p className="text-xs text-red-500 mt-2">
          Unable to fetch weather for {city}
        </p>
      </div>
    );
  }

  const tempUnit = units === "celsius" ? "°C" : "°F";

  return (
    <div
      className={`bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-6 text-white shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">{city}</h3>
          <p className="text-blue-100 text-sm">
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        </div>
        {temperature && (
          <div className="text-right">
            <span className="text-4xl font-bold">
              {Math.round(temperature)}
              {tempUnit}
            </span>
            {condition && (
              <p className="text-blue-100 text-sm capitalize">{condition}</p>
            )}
          </div>
        )}
      </div>

      {/* Current conditions */}
      {(humidity || windSpeed) && (
        <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-blue-300">
          {humidity && (
            <div className="text-center">
              <p className="text-blue-200 text-xs">Humidity</p>
              <p className="font-semibold">{Math.round(humidity)}%</p>
            </div>
          )}
          {windSpeed && (
            <div className="text-center">
              <p className="text-blue-200 text-xs">Wind</p>
              <p className="font-semibold">{Math.round(windSpeed)} km/h</p>
            </div>
          )}
        </div>
      )}

      {/* 5-day forecast */}
      {forecast.length > 0 && (
        <div className="pt-4 border-t border-blue-300">
          <p className="text-blue-200 text-sm mb-2">5-Day Forecast</p>
          <div className="grid grid-cols-5 gap-2">
            {forecast.slice(0, 5).map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-blue-200">{day.day}</div>
                <div className="text-sm font-medium">
                  {Math.round(day.high)}
                  {tempUnit}
                </div>
                <div className="text-xs text-blue-300">
                  {Math.round(day.low)}
                  {tempUnit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 3. Chat component integration (components/chat.tsx)
export function ChatWithWeather() {
  const { messages } = useChat();

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id} className="mb-4">
          <div className="prose">{message.content}</div>

          {/* Tool invocation rendering */}
          {message.toolInvocations?.map((tool) => {
            if (tool.state === "result" && tool.toolName === "displayWeather") {
              return (
                <WeatherCard
                  key={tool.toolCallId}
                  {...tool.result}
                  className="mt-4 animate-fadeIn"
                />
              );
            }

            // Loading state
            if (tool.state === "call" && tool.toolName === "displayWeather") {
              return (
                <div key={tool.toolCallId} className="mt-4">
                  <WeatherSkeleton city={tool.args.city} />
                </div>
              );
            }

            return null;
          })}
        </div>
      ))}
    </div>
  );
}

// 4. Loading skeleton component
function WeatherSkeleton({ city }: { city: string }) {
  return (
    <div className="bg-gray-200 rounded-lg p-6 animate-pulse">
      <div className="flex justify-between mb-4">
        <div>
          <div className="h-6 bg-gray-300 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
        <div className="text-right">
          <div className="h-12 bg-gray-300 rounded w-16 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="h-12 bg-gray-300 rounded"></div>
        <div className="h-12 bg-gray-300 rounded"></div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-300 rounded"></div>
        ))}
      </div>
    </div>
  );
}

// 5. Weather API helper (utils/weather.ts)
interface WeatherResponse {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
  }>;
}

interface WeatherApiItem {
  dt: number;
  main: {
    temp: number;
    temp_max: number;
    temp_min: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
  }>;
  wind: {
    speed: number;
  };
}

async function getWeatherData({
  latitude,
  longitude,
  units,
}: {
  latitude: number;
  longitude: number;
  units: "celsius" | "fahrenheit";
}): Promise<WeatherResponse> {
  // Replace with your weather API (OpenWeatherMap, WeatherAPI, etc.)
  const API_KEY = process.env.WEATHER_API_KEY;

  if (!API_KEY) {
    throw new Error("Weather API key not configured");
  }

  const tempUnit = units === "celsius" ? "metric" : "imperial";

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${tempUnit}`
  );

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();

  // Transform API response to our format
  return {
    temperature: data.list[0].main.temp,
    condition: data.list[0].weather[0].description,
    humidity: data.list[0].main.humidity,
    windSpeed: data.list[0].wind.speed,
    forecast: data.list.slice(0, 5).map((item: WeatherApiItem) => ({
      day: new Date(item.dt * 1000).toLocaleDateString("en", {
        weekday: "short",
      }),
      high: item.main.temp_max,
      low: item.main.temp_min,
      condition: item.weather[0].description,
    })),
  };
}

// 6. Usage in API route (app/api/chat/route.ts)
export async function POST(req: Request) {
  const result = streamText({
    model: openai("gpt-4o"),
    messages: [], // Your messages array
    tools: {
      ...weatherTool, // Add the weather tool
      // Add other tools...
    },
  });

  return result.toDataStreamResponse();
}

/*
Usage Example:
User: "What's the weather like in Paris?"
AI: "I'll check the current weather in Paris for you."
-> Tool call with coordinates for Paris
-> WeatherCard renders with current conditions and 5-day forecast

Key Benefits:
✅ Rich visual weather display
✅ Graceful error handling
✅ Loading states for better UX
✅ Responsive design
✅ Type-safe implementation
✅ Easy to extend with more weather features

📖 References & Sources:
- AI SDK Tools: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- OpenWeatherMap API: https://openweathermap.org/api
- React TypeScript: https://react.dev/learn/typescript
- Tailwind CSS: https://tailwindcss.com/docs
- Error Boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
*/
