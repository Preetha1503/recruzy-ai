import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const generateQuestionsForType = async (topic: string, difficulty: string, type: string, language?: string) => {
  let prompt = ""

  switch (type) {
    case "code_snippet":
      prompt = `Generate a ${difficulty} ${language || "programming"} code analysis question about ${topic}. 
      Include a code snippet and ask what the code does or what concept it demonstrates.
      Return the response in this exact JSON format:
      {
        "text": "What does this code do?",
        "type": "code_snippet",
        "code_snippet": "actual code here",
        "programming_language": "${language}",
        "options": ["option1", "option2", "option3", "option4"],
        "correct_answer": 0,
        "explanation": "explanation here",
        "difficulty": "${difficulty}"
      }`
      break

    case "output_prediction":
      prompt = `Generate a ${difficulty} ${language || "programming"} output prediction question about ${topic}.
      Include a code snippet and ask what the output will be.
      Return the response in this exact JSON format:
      {
        "text": "What will be the output of this code?",
        "type": "output_prediction", 
        "code_snippet": "actual code here",
        "programming_language": "${language}",
        "expected_output": "format description",
        "options": ["output1", "output2", "output3", "output4"],
        "correct_answer": 0,
        "explanation": "explanation here",
        "difficulty": "${difficulty}"
      }`
      break

    case "error_identification":
      prompt = `Generate a ${difficulty} ${language || "programming"} error identification question about ${topic}.
      Include a code snippet with an error and ask to identify the problem.
      Return the response in this exact JSON format:
      {
        "text": "What is wrong with this code?",
        "type": "error_identification",
        "code_snippet": "code with error here", 
        "programming_language": "${language}",
        "error_line": 3,
        "options": ["error1", "error2", "error3", "error4"],
        "correct_answer": 0,
        "explanation": "explanation here",
        "difficulty": "${difficulty}"
      }`
      break

    default:
      prompt = `Generate a ${difficulty} multiple choice question about ${topic}.
      Return the response in this exact JSON format:
      {
        "text": "question text here",
        "type": "multiple_choice",
        "options": ["option1", "option2", "option3", "option4"],
        "correct_answer": 0,
        "explanation": "explanation here", 
        "difficulty": "${difficulty}"
      }`
  }

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "gpt-3.5-turbo",
  })

  const content = completion.choices[0].message.content

  if (!content) {
    throw new Error("Failed to generate question content.")
  }

  try {
    return JSON.parse(content)
  } catch (error) {
    console.error("Error parsing JSON:", error)
    console.error("Problematic content:", content)
    throw new Error("Failed to parse generated JSON.")
  }
}

export async function POST(req: Request) {
  try {
    const { topic, difficulty, type, language } = await req.json()

    if (!topic || !difficulty || !type) {
      return new NextResponse("Missing parameters", { status: 400 })
    }

    const question = await generateQuestionsForType(topic, difficulty, type, language)

    return NextResponse.json(question)
  } catch (error) {
    console.log("[GENERATE_QUESTIONS_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
