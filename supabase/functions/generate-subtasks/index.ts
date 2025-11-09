import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { taskTitle } = await req.json();

    if (!taskTitle) {
      return new Response(
        JSON.stringify({ error: "Task title is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const systemPrompt = `You are a helpful assistant that breaks down big tasks into simple, clear
subtasks. Given a main task title, return a list of 5 to 7 clear, short subtasks
needed to complete it. The subtasks should be practical and written in plain
language. Return them as a plain JSON array. Do not include any extra text or
explanations.

Main task: "Plan a wedding"
Example output:
[
"Book wedding venue"
"Hire photographer",
"Send invitations",
"Arrange catering"
"Plan wedding ceremony",
"Choose wedding dress",
"Plan honeymoon"
]
Now generate subtasks for this task:
"{{PARENT_TASK_TITLE}}"`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: systemPrompt.replace("{{PARENT_TASK_TITLE}}", taskTitle)
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: taskTitle
              }
            ]
          }
        ],
        text: {
          format: {
            type: "text"
          }
        },
        reasoning: {},
        tools: [],
        temperature: 1,
        max_output_tokens: 2048,
        top_p: 1,
        store: true,
        include: ["web_search_call.action.sources"]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.output[0].content[0].text;

    let subtasks: string[];
    try {
      subtasks = JSON.parse(content);
    } catch {
      subtasks = content.split('\n').filter((line: string) => line.trim() && !line.match(/^[\d.\-*]+$/)).map((line: string) => line.replace(/^[\d.\-*\s]+/, '').trim());
    }

    return new Response(
      JSON.stringify({ subtasks }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});