import { useEffect, useState } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  ClipboardList,
  Clock3,
} from "lucide-react";

import {
  getApplications,
  getAssignments,
  getCourses,
  getHealth,
  getSavedStudyPlans,
} from "../../services/api";

type SummaryCard = {
  title: string;
  value: number;
  description: string;
  icon: typeof ClipboardList;
  iconClassName: string;
};

export default function Dashboard() {
  const [apiMessage, setApiMessage] = useState("Checking API connection...");
  const [apiConnected, setApiConnected] = useState(false);
  const [courseCount, setCourseCount] = useState(0);
  const [upcomingAssignmentCount, setUpcomingAssignmentCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [plannedStudyHours, setPlannedStudyHours] = useState(0);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [healthResponse, courses, assignments, applications, studyPlans] =
          await Promise.all([
            getHealth(),
            getCourses(),
            getAssignments(),
            getApplications(),
            getSavedStudyPlans(),
          ]);

        setApiMessage(healthResponse.message);
        setApiConnected(true);
        setCourseCount(courses.length);
        setApplicationCount(applications.length);

        const totalPlannedStudyHours = studyPlans.reduce(
          (total, studyPlan) => total + studyPlan.availableHours,
          0,
        );

        setPlannedStudyHours(totalPlannedStudyHours);

        const activeAssignments = assignments.filter(
          (assignment) => !assignment.completed,
        );

        setUpcomingAssignmentCount(activeAssignments.length);
      } catch {
        setApiMessage("CampusPilot API is unavailable.");
        setApiConnected(false);
      }
    }

    void loadDashboardData();
  }, []);

  const summaryCards: SummaryCard[] = [
    {
      title: "Active assignments",
      value: upcomingAssignmentCount,
      description: "Not completed yet",
      icon: ClipboardList,
      iconClassName: "bg-red-100 text-red-700",
    },
    {
      title: "Active courses",
      value: courseCount,
      description: "Current semester",
      icon: BookOpen,
      iconClassName: "bg-primary/10 text-primary",
    },
    {
      title: "Planned study hours",
      value: plannedStudyHours,
      description: "Across saved plans",
      icon: Clock3,
      iconClassName: "bg-violet-100 text-violet-700",
    },
    {
      title: "Applications",
      value: applicationCount,
      description: "Internships tracked",
      icon: BriefcaseBusiness,
      iconClassName: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-2xl bg-white px-6 py-7 shadow-[0_14px_30px_rgba(31,41,55,0.08)] sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold text-primary">CampusPilot overview</p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Welcome back, Ved
            </h1>

            <p className="mt-2 max-w-2xl text-gray-600">
              Here is an overview of your academic and career progress.
            </p>
          </div>

          <div
            aria-live="polite"
            className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-sm font-medium ${
              apiConnected
                ? "bg-green-50 text-green-800"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                apiConnected ? "bg-green-600" : "bg-amber-500"
              }`}
            />
            {apiMessage}
          </div>
        </div>
      </section>

      <section aria-labelledby="today-heading" className="mt-10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="today-heading" className="text-xl font-bold text-gray-900">
              Today at a glance
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Your live totals update as you manage CampusPilot.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(31,41,55,0.10)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold text-gray-600">
                    {card.title}
                  </p>

                  <div className={`rounded-xl p-2.5 ${card.iconClassName}`}>
                    <Icon aria-hidden="true" size={20} strokeWidth={2.25} />
                  </div>
                </div>

                <p className="mt-6 text-4xl font-bold tracking-tight text-gray-900">
                  {card.value}
                </p>

                <p className="mt-1 text-sm text-gray-500">{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
