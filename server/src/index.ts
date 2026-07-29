import "dotenv/config";
import cors from "cors";
import express from "express";
import { prisma } from "./lib/prisma.js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



const app = express();
const port = process.env.PORT ?? 4000;

app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = new Set([
        "http://localhost:5173",
        "https://drama-leslie-convert-pray.trycloudflare.com",
        "null",
      ]);

      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CampusPilot API."));
    },
  }),
);

app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    message: "CampusPilot API is running",
  });
});

app.get("/api/courses", async (_request, response) => {
  const courses = await prisma.course.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  response.status(200).json(courses);
});

app.get("/api/assignments", async (_request, response) => {
  const assignments = await prisma.assignment.findMany({
    orderBy: {
      dueDate: "asc",
    },
  });

  response.status(200).json(assignments);
});

app.post("/api/assignments", async (request, response) => {
  const { title, course, dueDate, priority } = request.body;

  const validPriorities = ["Low", "Medium", "High"];

  if (
    typeof title !== "string" ||
    typeof course !== "string" ||
    typeof dueDate !== "string" ||
    typeof priority !== "string" ||
    !title.trim() ||
    !course.trim() ||
    !validPriorities.includes(priority)
  ) {
    return response.status(400).json({
      message: "Valid assignment details are required.",
    });
  }

  const parsedDueDate = new Date(dueDate);

  if (Number.isNaN(parsedDueDate.getTime())) {
    return response.status(400).json({
      message: "Due date must be valid.",
    });
  }

  const newAssignment = await prisma.assignment.create({
    data: {
      title: title.trim(),
      course: course.trim(),
      dueDate: parsedDueDate,
      priority,
      completed: false,
    },
  });

  return response.status(201).json(newAssignment);
});

app.patch("/api/assignments/:id", async (request, response) => {
  const id = Number(request.params.id);
  const { completed } = request.body;

  if (!Number.isInteger(id) || typeof completed !== "boolean") {
    return response.status(400).json({
      message: "A valid assignment ID and completed value are required.",
    });
  }

  const existingAssignment = await prisma.assignment.findUnique({
    where: { id },
  });

  if (!existingAssignment) {
    return response.status(404).json({
      message: "Assignment not found.",
    });
  }

  const updatedAssignment = await prisma.assignment.update({
    where: { id },
    data: { completed },
  });

  return response.status(200).json(updatedAssignment);
});

app.delete("/api/assignments/:id", async (request, response) => {
  const id = Number(request.params.id);

  if (!Number.isInteger(id)) {
    return response.status(400).json({
      message: "Assignment ID must be a whole number.",
    });
  }

  const existingAssignment = await prisma.assignment.findUnique({
    where: { id },
  });

  if (!existingAssignment) {
    return response.status(404).json({
      message: "Assignment not found.",
    });
  }

  await prisma.assignment.delete({
    where: { id },
  });

  return response.status(204).send();
});

app.post("/api/courses", async (request, response) => {
  const { code, name, instructor, credits } = request.body;

  if (
    typeof code !== "string" ||
    typeof name !== "string" ||
    typeof instructor !== "string" ||
    typeof credits !== "number" ||
    !code.trim() ||
    !name.trim() ||
    !instructor.trim() ||
    credits <= 0
  ) {
    return response.status(400).json({
      message: "Course code, name, instructor, and valid credits are required.",
    });
  }

  const newCourse = await prisma.course.create({
    data: {
      code: code.trim(),
      name: name.trim(),
      instructor: instructor.trim(),
      credits,
    },
  });

  return response.status(201).json(newCourse);
});

app.delete("/api/courses/:id", async (request, response) => {
  const id = Number(request.params.id);

  if (!Number.isInteger(id)) {
    return response.status(400).json({
      message: "Course ID must be a whole number.",
    });
  }

  const existingCourse = await prisma.course.findUnique({
    where: { id },
  });

  if (!existingCourse) {
    return response.status(404).json({
      message: "Course not found.",
    });
  }

  await prisma.course.delete({
    where: { id },
  });

  return response.status(204).send();
});

app.get("/api/applications", async (_request, response) => {
  const applications = await prisma.jobApplication.findMany({
    orderBy: {
      appliedDate: "desc",
    },
  });

  return response.status(200).json(applications);
});

app.post("/api/applications", async (request, response) => {
  const { company, role, location, appliedDate, status } = request.body;

  const validStatuses = [
    "Applied",
    "Interviewing",
    "Offer",
    "Rejected",
  ];

  if (
    typeof company !== "string" ||
    typeof role !== "string" ||
    typeof location !== "string" ||
    typeof appliedDate !== "string" ||
    typeof status !== "string" ||
    !company.trim() ||
    !role.trim() ||
    !location.trim() ||
    !validStatuses.includes(status)
  ) {
    return response.status(400).json({
      message: "Valid application details are required.",
    });
  }

  const parsedAppliedDate = new Date(appliedDate);

  if (Number.isNaN(parsedAppliedDate.getTime())) {
    return response.status(400).json({
      message: "Application date must be valid.",
    });
  }

  const newApplication = await prisma.jobApplication.create({
    data: {
      company: company.trim(),
      role: role.trim(),
      location: location.trim(),
      appliedDate: parsedAppliedDate,
      status,
    },
  });

  return response.status(201).json(newApplication);
});

app.delete("/api/applications/:id", async (request, response) => {
  const id = Number(request.params.id);

  if (!Number.isInteger(id)) {
    return response.status(400).json({
      message: "Application ID must be a whole number.",
    });
  }

  const existingApplication = await prisma.jobApplication.findUnique({
    where: { id },
  });

  if (!existingApplication) {
    return response.status(404).json({
      message: "Application not found.",
    });
  }

  await prisma.jobApplication.delete({
    where: { id },
  });

  return response.status(204).send();
});

app.get("/api/study-plans", async (_request, response) => {
  const studyPlans = await prisma.studyPlan.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return response.status(200).json(studyPlans);
});

app.post("/api/study-plans", async (request, response) => {
  const {
    course,
    goal,
    deadline,
    availableHours,
    difficulty,
    plan,
    source,
  } = request.body;

  const validDifficulties = ["Easy", "Medium", "Hard"];
  const validSources = ["ai", "fallback"];

  if (
    typeof course !== "string" ||
    typeof goal !== "string" ||
    typeof deadline !== "string" ||
    typeof availableHours !== "number" ||
    typeof difficulty !== "string" ||
    typeof plan !== "string" ||
    typeof source !== "string" ||
    !course.trim() ||
    !goal.trim() ||
    !plan.trim() ||
    availableHours <= 0 ||
    !validDifficulties.includes(difficulty) ||
    !validSources.includes(source)
  ) {
    return response.status(400).json({
      message: "Valid saved study-plan details are required.",
    });
  }

  const parsedDeadline = new Date(deadline);

  if (Number.isNaN(parsedDeadline.getTime())) {
    return response.status(400).json({
      message: "Deadline must be valid.",
    });
  }

  const savedStudyPlan = await prisma.studyPlan.create({
    data: {
      course: course.trim(),
      goal: goal.trim(),
      deadline: parsedDeadline,
      availableHours,
      difficulty,
      plan: plan.trim(),
      source,
    },
  });

  return response.status(201).json(savedStudyPlan);
});

app.delete("/api/study-plans/:id", async (request, response) => {
  const id = Number(request.params.id);

  if (!Number.isInteger(id)) {
    return response.status(400).json({
      message: "Study plan ID must be a whole number.",
    });
  }

  const existingStudyPlan = await prisma.studyPlan.findUnique({
    where: { id },
  });

  if (!existingStudyPlan) {
    return response.status(404).json({
      message: "Study plan not found.",
    });
  }

  await prisma.studyPlan.delete({
    where: { id },
  });

  return response.status(204).send();
});

app.post("/api/study-plans/generate", async (request, response) => {
  const {
    course,
    goal,
    deadline,
    availableHours,
    difficulty,
  } = request.body;

  const validDifficulties = ["Easy", "Medium", "Hard"];

  if (
    typeof course !== "string" ||
    typeof goal !== "string" ||
    typeof deadline !== "string" ||
    typeof availableHours !== "number" ||
    typeof difficulty !== "string" ||
    !course.trim() ||
    !goal.trim() ||
    availableHours <= 0 ||
    !validDifficulties.includes(difficulty)
  ) {
    return response.status(400).json({
      message: "Valid study-plan details are required.",
    });
  }

  try {
    const aiResponse = await openai.responses.create({
      model: "gpt-5.6-luna",
      input: `Create a practical study plan for a college student.

Course: ${course.trim()}
Goal: ${goal.trim()}
Deadline: ${deadline}
Available study hours: ${availableHours}
Difficulty: ${difficulty}

Return 4 to 6 concise study sessions.
Put each session on its own line.
Include a specific focus area and estimated time for each session.
Do not use markdown headings or introductory text.`,
    });

    const plan = aiResponse.output_text.trim();

    if (!plan) {
      return response.status(502).json({
        message: "The AI did not return a study plan.",
      });
    }

    return response.status(200).json({ plan });
  } catch (error) {
    console.error("Could not generate study plan:", error);

    return response.status(502).json({
      message: "Could not generate a study plan right now.",
    });
  }
});

app.listen(port, () => {
  console.log(`CampusPilot API running at http://localhost:${port}`);
});
