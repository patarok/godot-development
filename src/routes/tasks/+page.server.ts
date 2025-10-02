import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import {
  AppDataSource,
  initializeDatabase,
  Task,
  Priority,
  TaskStatus,
  Tag,
  TaskTag,
  User,
  UserTask
} from '$lib/server/database';
import { toPlainArray } from '$lib/utils/index';
import { In } from 'typeorm';

function slugifyTag(s: string) {
  return s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
      .slice(0, 64);
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) return redirect(302, '/login');
  await initializeDatabase();

  const taskRepo = AppDataSource.getRepository(Task);
  const priorityRepo = AppDataSource.getRepository(Priority);
  const stateRepo = AppDataSource.getRepository(TaskStatus);
  const tagRepo = AppDataSource.getRepository(Tag);
  const userRepo = AppDataSource.getRepository(User);
  const taskTagRepo = AppDataSource.getRepository(TaskTag);

  const genericTaskData = [
    {
      id: 1,
      header: "Design landing page",
      type: "UI/UX",
      status: "In Process",
      priority: "High",
      assignedProject: "Website Redesign",
      plannedSchedule: {
        plannedStart: new Date("2025-01-10T09:00:00Z"),
        plannedDue: new Date("2025-01-20T18:00:00Z")
      },
      mainAssignee: "Alice Johnson",
      assignedUsers: ["Bob Smith", "Charlie Evans", "Diana Lee"],
      isActive: true,
      created: new Date("2025-01-05T10:30:00Z"),
      updated: new Date("2025-01-09T15:45:00Z"),
      tags: ["frontend", "design", "Figma", "UI"]
    },
    {
      id: 2,
      header: "Set up CI/CD pipeline",
      type: "DevOps",
      status: "Not Started",
      priority: "Medium",
      assignedProject: "Internal Tools",
      plannedSchedule: {
        plannedStart: new Date("2025-01-15T08:00:00Z"),
        plannedDue: new Date("2025-01-25T17:00:00Z")
      },
      mainAssignee: "David Clark",
      assignedUsers: ["Eve Turner", "Frank Harris"],
      isActive: true,
      created: new Date("2025-01-06T09:15:00Z"),
      updated: new Date("2025-01-06T09:15:00Z"),
      tags: ["automation", "deployment", "github-actions"]
    },
    {
      id: 3,
      header: "Write unit tests for API",
      type: "Backend",
      status: "In Review",
      priority: "High",
      assignedProject: "Payment Service",
      plannedSchedule: {
        plannedStart: new Date("2025-01-12T10:00:00Z"),
        plannedDue: new Date("2025-01-18T16:00:00Z")
      },
      mainAssignee: "Sophia Martinez",
      assignedUsers: ["George King", "Helen Adams"],
      isActive: true,
      created: new Date("2025-01-07T11:00:00Z"),
      updated: new Date("2025-01-14T14:20:00Z"),
      tags: ["testing", "jest", "coverage"]
    },
    {
      id: 4,
      header: "Marketing campaign plan",
      type: "Documentation",
      status: "Completed",
      priority: "Low",
      assignedProject: "Q1 Launch",
      plannedSchedule: {
        plannedStart: new Date("2024-12-20T09:00:00Z"),
        plannedDue: new Date("2025-01-05T18:00:00Z")
      },
      mainAssignee: "Michael Brown",
      assignedUsers: ["Isabella Moore", "Jack Wilson"],
      isActive: false,
      created: new Date("2024-12-15T12:00:00Z"),
      updated: new Date("2025-01-05T18:10:00Z"),
      tags: ["marketing", "campaign", "planning"]
    },
    {
      id: 5,
      header: "Database schema refactor",
      type: "Backend",
      status: "In Process",
      priority: "Critical",
      assignedProject: "Analytics Platform",
      plannedSchedule: {
        plannedStart: new Date("2025-01-08T08:30:00Z"),
        plannedDue: new Date("2025-01-22T17:30:00Z")
      },
      mainAssignee: "Emily Davis",
      assignedUsers: ["Liam Scott", "Olivia White"],
      isActive: true,
      created: new Date("2025-01-02T14:00:00Z"),
      updated: new Date("2025-01-11T09:45:00Z"),
      tags: ["database", "postgres", "migration"]
    },
    {
      id: 6,
      header: "Prepare quarterly report",
      type: "Reporting",
      status: "In Process",
      priority: "Medium",
      assignedProject: "Finance Department",
      plannedSchedule: {
        plannedStart: new Date("2025-01-10T07:00:00Z"),
        plannedDue: new Date("2025-01-30T19:00:00Z")
      },
      mainAssignee: "Chris Taylor",
      assignedUsers: ["Natalie Green", "Oscar Wright"],
      isActive: true,
      created: new Date("2025-01-04T09:30:00Z"),
      updated: new Date("2025-01-12T16:50:00Z"),
      tags: ["finance", "reporting", "excel"]
    },
    {
      id: 7,
      header: "Customer survey analysis",
      type: "Analytics",
      status: "Not Started",
      priority: "Low",
      assignedProject: "Customer Success",
      plannedSchedule: {
        plannedStart: new Date("2025-01-20T08:00:00Z"),
        plannedDue: new Date("2025-02-05T18:00:00Z")
      },
      mainAssignee: "Laura Johnson",
      assignedUsers: ["Peter Hall", "Quinn Young"],
      isActive: true,
      created: new Date("2025-01-10T11:45:00Z"),
      updated: new Date("2025-01-10T11:45:00Z"),
      tags: ["survey", "data-analysis", "customers"]
    },
    {
      id: 8,
      header: "Fix mobile layout bugs",
      type: "Frontend",
      status: "In Review",
      priority: "High",
      assignedProject: "E-Commerce App",
      plannedSchedule: {
        plannedStart: new Date("2025-01-09T09:00:00Z"),
        plannedDue: new Date("2025-01-14T15:00:00Z")
      },
      mainAssignee: "Brian Clark",
      assignedUsers: ["Rachel Parker", "Sam Walker"],
      isActive: true,
      created: new Date("2025-01-05T08:20:00Z"),
      updated: new Date("2025-01-13T12:10:00Z"),
      tags: ["mobile", "bugfix", "UI"]
    },
    {
      id: 9,
      header: "Legal compliance check",
      type: "Audit",
      status: "Completed",
      priority: "Critical",
      assignedProject: "Regulation 2025",
      plannedSchedule: {
        plannedStart: new Date("2024-12-10T08:00:00Z"),
        plannedDue: new Date("2024-12-30T17:00:00Z")
      },
      mainAssignee: "Victoria Lee",
      assignedUsers: ["Thomas Allen"],
      isActive: false,
      created: new Date("2024-12-05T09:00:00Z"),
      updated: new Date("2024-12-30T17:05:00Z"),
      tags: ["compliance", "audit", "legal"]
    },
    {
      id: 10,
      header: "Onboarding new hires",
      type: "HR",
      status: "In Process",
      priority: "Medium",
      assignedProject: "Talent Management",
      plannedSchedule: {
        plannedStart: new Date("2025-01-03T09:00:00Z"),
        plannedDue: new Date("2025-01-31T18:00:00Z")
      },
      mainAssignee: "Angela Morris",
      assignedUsers: ["Uma Collins", "Victor Perez"],
      isActive: true,
      created: new Date("2025-01-02T09:15:00Z"),
      updated: new Date("2025-01-15T10:30:00Z"),
      tags: ["hr", "onboarding", "training"]
    },
    {
      id: 11,
      header: "Cloud infrastructure cost review",
      type: "Finance/DevOps",
      status: "In Process",
      priority: "High",
      assignedProject: "AWS Optimization",
      plannedSchedule: {
        plannedStart: new Date("2025-01-12T10:00:00Z"),
        plannedDue: new Date("2025-01-28T16:00:00Z")
      },
      mainAssignee: "Daniel Roberts",
      assignedUsers: ["Wendy Hughes", "Xavier Murphy"],
      isActive: true,
      created: new Date("2025-01-07T12:10:00Z"),
      updated: new Date("2025-01-13T15:25:00Z"),
      tags: ["aws", "cost", "cloud"]
    },
    {
      id: 12,
      header: "Refactor authentication module",
      type: "Backend",
      status: "Not Started",
      priority: "Critical",
      assignedProject: "Security Update",
      plannedSchedule: {
        plannedStart: new Date("2025-01-18T09:00:00Z"),
        plannedDue: new Date("2025-01-27T18:00:00Z")
      },
      mainAssignee: "Yvonne Scott",
      assignedUsers: ["Zachary Lee", "Alan Kim"],
      isActive: true,
      created: new Date("2025-01-09T08:00:00Z"),
      updated: new Date("2025-01-09T08:00:00Z"),
      tags: ["auth", "security", "backend"]
    },
    {
      id: 13,
      header: "Prepare investor presentation",
      type: "Business",
      status: "In Review",
      priority: "High",
      assignedProject: "Funding Round B",
      plannedSchedule: {
        plannedStart: new Date("2025-01-05T10:00:00Z"),
        plannedDue: new Date("2025-01-15T17:00:00Z")
      },
      mainAssignee: "Olivia Martinez",
      assignedUsers: ["Brian Clark", "David Clark"],
      isActive: true,
      created: new Date("2025-01-04T14:20:00Z"),
      updated: new Date("2025-01-14T11:40:00Z"),
      tags: ["investors", "presentation", "pitchdeck"]
    },
    {
      id: 14,
      header: "Conduct penetration test",
      type: "Security",
      status: "In Process",
      priority: "Critical",
      assignedProject: "Cybersecurity Audit",
      plannedSchedule: {
        plannedStart: new Date("2025-01-11T09:00:00Z"),
        plannedDue: new Date("2025-01-21T18:00:00Z")
      },
      mainAssignee: "Samuel Green",
      assignedUsers: ["Clara Moore", "Ethan Lewis"],
      isActive: true,
      created: new Date("2025-01-08T08:45:00Z"),
      updated: new Date("2025-01-12T13:00:00Z"),
      tags: ["security", "pentest", "vulnerability"]
    },
    {
      id: 15,
      header: "Customer support knowledge base",
      type: "Documentation",
      status: "Not Started",
      priority: "Low",
      assignedProject: "Help Center",
      plannedSchedule: {
        plannedStart: new Date("2025-01-22T08:00:00Z"),
        plannedDue: new Date("2025-02-10T17:00:00Z")
      },
      mainAssignee: "Grace Lee",
      assignedUsers: ["Henry Adams", "Ivy Brooks"],
      isActive: true,
      created: new Date("2025-01-12T09:30:00Z"),
      updated: new Date("2025-01-12T09:30:00Z"),
      tags: ["support", "docs", "knowledge-base"]
    },
    {
      id: 16,
      header: "Sprint retrospective",
      type: "Agile",
      status: "Completed",
      priority: "Medium",
      assignedProject: "Sprint 21",
      plannedSchedule: {
        plannedStart: new Date("2025-01-01T09:00:00Z"),
        plannedDue: new Date("2025-01-07T16:00:00Z")
      },
      mainAssignee: "Jason Miller",
      assignedUsers: ["Karen Scott", "Leo Carter"],
      isActive: false,
      created: new Date("2024-12-28T12:00:00Z"),
      updated: new Date("2025-01-07T16:10:00Z"),
      tags: ["agile", "scrum", "retrospective"]
    }
  ];

  const genericTaskDataShort = [
    {
      id: 1,
      header: "Cover page",
      type: "Cover page",
      status: "In Process",
      priority: "low prio",
      assignedProject: "I am at least 18 :) ",
      plannedSchedule: {
        plannedStart: new Date("2025-01-15T08:00:00Z"),
        plannedDue: new Date("2025-01-25T17:00:00Z")
      },
      mainAssignee: "Eddie Lake",
      assignedUsers: [ "Frodo", "Bilbo", "Gandalf", "Gollum Gollum" ],
      isActive: 'false',
      created: new Date("2025-01-06T09:15:00Z"),
      updated: new Date("2025-01-06T09:15:00Z"),
      tags: [ "schmurgul", "furgul", "gurgul", "liebesgruesseausmordor" ]
    },
    {
      id: 2,
      header: "Set up CI/CD pipeline",
      type: "DevOps",
      status: "Not Started",
      priority: "Medium",
      assignedProject: "Internal Tools",
      plannedSchedule: {
        plannedStart: new Date("2025-01-15T08:00:00Z"),
        plannedDue: new Date("2025-01-25T17:00:00Z")
      },
      mainAssignee: "David Clark",
      assignedUsers: ["Eve Turner", "Frank Harris"],
      isActive: true,
      created: new Date("2025-01-06T09:15:00Z"),
      updated: new Date("2025-01-06T09:15:00Z"),
      tags: ["automation", "deployment", "github-actions"]
    },
    ];

  const genericListData = [
    {
      id: 1,
      header: "Cover page",
      type: "Cover page",
      status: "In Process",
      target: "18",
      limit: "5",
      reviewer: "Eddie Lake",
    },
    {
      id: 2,
      header: "Table of contents",
      type: "Table of contents",
      status: "Done",
      target: "29",
      limit: "24",
      reviewer: "Eddie Lake",
    },
    {
      id: 3,
      header: "Executive summary",
      type: "Narrative",
      status: "Done",
      target: "10",
      limit: "13",
      reviewer: "Eddie Lake",
    },
    {
      id: 4,
      header: "Technical approach",
      type: "Narrative",
      status: "Done",
      target: "27",
      limit: "23",
      reviewer: "Jamik Tashpulatov",
    },
    {
      id: 5,
      header: "Design",
      type: "Narrative",
      status: "In Process",
      target: "2",
      limit: "16",
      reviewer: "Jamik Tashpulatov",
    },
    {
      id: 6,
      header: "Capabilities",
      type: "Narrative",
      status: "In Process",
      target: "20",
      limit: "8",
      reviewer: "Jamik Tashpulatov",
    },
    {
      id: 7,
      header: "Integration with existing systems",
      type: "Narrative",
      status: "In Process",
      target: "19",
      limit: "21",
      reviewer: "Jamik Tashpulatov",
    },
    {
      id: 8,
      header: "Innovation and Advantages",
      type: "Narrative",
      status: "Done",
      target: "25",
      limit: "26",
      reviewer: "Assign reviewer",
    },
    {
      id: 9,
      header: "Overview of EMR's Innovative Solutions",
      type: "Technical content",
      status: "Done",
      target: "7",
      limit: "23",
      reviewer: "Assign reviewer",
    },
    {
      id: 10,
      header: "Advanced Algorithms and Machine Learning",
      type: "Narrative",
      status: "Done",
      target: "30",
      limit: "28",
      reviewer: "Assign reviewer",
    },
    {
      id: 11,
      header: "Adaptive Communication Protocols",
      type: "Narrative",
      status: "Done",
      target: "9",
      limit: "31",
      reviewer: "Assign reviewer",
    },
    {
      id: 12,
      header: "Advantages Over Current Technologies",
      type: "Narrative",
      status: "Done",
      target: "12",
      limit: "0",
      reviewer: "Assign reviewer",
    },
    {
      id: 13,
      header: "Past Performance",
      type: "Narrative",
      status: "Done",
      target: "22",
      limit: "33",
      reviewer: "Assign reviewer",
    },
    {
      id: 14,
      header: "Customer Feedback and Satisfaction Levels",
      type: "Narrative",
      status: "Done",
      target: "15",
      limit: "34",
      reviewer: "Assign reviewer",
    },
    {
      id: 15,
      header: "Implementation Challenges and Solutions",
      type: "Narrative",
      status: "Done",
      target: "3",
      limit: "35",
      reviewer: "Assign reviewer",
    },
    {
      id: 16,
      header: "Security Measures and Data Protection Policies",
      type: "Narrative",
      status: "In Process",
      target: "6",
      limit: "36",
      reviewer: "Assign reviewer",
    },
    {
      id: 17,
      header: "Scalability and Future Proofing",
      type: "Narrative",
      status: "Done",
      target: "4",
      limit: "37",
      reviewer: "Assign reviewer",
    },
    {
      id: 18,
      header: "Cost-Benefit Analysis",
      type: "Plain language",
      status: "Done",
      target: "14",
      limit: "38",
      reviewer: "Assign reviewer",
    },
    {
      id: 19,
      header: "User Training and Onboarding Experience",
      type: "Narrative",
      status: "Done",
      target: "17",
      limit: "39",
      reviewer: "Assign reviewer",
    },
    {
      id: 20,
      header: "Future Development Roadmap",
      type: "Narrative",
      status: "Done",
      target: "11",
      limit: "40",
      reviewer: "Assign reviewer",
    },
    {
      id: 21,
      header: "System Architecture Overview",
      type: "Technical content",
      status: "In Process",
      target: "24",
      limit: "18",
      reviewer: "Maya Johnson",
    },
    {
      id: 22,
      header: "Risk Management Plan",
      type: "Narrative",
      status: "Done",
      target: "15",
      limit: "22",
      reviewer: "Carlos Rodriguez",
    },
    {
      id: 23,
      header: "Compliance Documentation",
      type: "Legal",
      status: "In Process",
      target: "31",
      limit: "27",
      reviewer: "Sarah Chen",
    },
    {
      id: 24,
      header: "API Documentation",
      type: "Technical content",
      status: "Done",
      target: "8",
      limit: "12",
      reviewer: "Raj Patel",
    },
    {
      id: 25,
      header: "User Interface Mockups",
      type: "Visual",
      status: "In Process",
      target: "19",
      limit: "25",
      reviewer: "Leila Ahmadi",
    },
    {
      id: 26,
      header: "Database Schema",
      type: "Technical content",
      status: "Done",
      target: "22",
      limit: "20",
      reviewer: "Thomas Wilson",
    },
    {
      id: 27,
      header: "Testing Methodology",
      type: "Technical content",
      status: "In Process",
      target: "17",
      limit: "14",
      reviewer: "Assign reviewer",
    },
    {
      id: 28,
      header: "Deployment Strategy",
      type: "Narrative",
      status: "Done",
      target: "26",
      limit: "30",
      reviewer: "Eddie Lake",
    },
    {
      id: 29,
      header: "Budget Breakdown",
      type: "Financial",
      status: "In Process",
      target: "13",
      limit: "16",
      reviewer: "Jamik Tashpulatov",
    },
    {
      id: 30,
      header: "Market Analysis",
      type: "Research",
      status: "Done",
      target: "29",
      limit: "32",
      reviewer: "Sophia Martinez",
    },
    {
      id: 31,
      header: "Competitor Comparison",
      type: "Research",
      status: "In Process",
      target: "21",
      limit: "19",
      reviewer: "Assign reviewer",
    },
    {
      id: 32,
      header: "Maintenance Plan",
      type: "Technical content",
      status: "Done",
      target: "16",
      limit: "23",
      reviewer: "Alex Thompson",
    },
    {
      id: 33,
      header: "User Personas",
      type: "Research",
      status: "In Process",
      target: "27",
      limit: "24",
      reviewer: "Nina Patel",
    },
    {
      id: 34,
      header: "Accessibility Compliance",
      type: "Legal",
      status: "Done",
      target: "18",
      limit: "21",
      reviewer: "Assign reviewer",
    },
    {
      id: 35,
      header: "Performance Metrics",
      type: "Technical content",
      status: "In Process",
      target: "23",
      limit: "26",
      reviewer: "David Kim",
    },
    {
      id: 36,
      header: "Disaster Recovery Plan",
      type: "Technical content",
      status: "Done",
      target: "14",
      limit: "17",
      reviewer: "Jamik Tashpulatov",
    },
    {
      id: 37,
      header: "Third-party Integrations",
      type: "Technical content",
      status: "In Process",
      target: "25",
      limit: "28",
      reviewer: "Eddie Lake",
    },
    {
      id: 38,
      header: "User Feedback Summary",
      type: "Research",
      status: "Done",
      target: "20",
      limit: "15",
      reviewer: "Assign reviewer",
    },
    {
      id: 39,
      header: "Localization Strategy",
      type: "Narrative",
      status: "In Process",
      target: "12",
      limit: "19",
      reviewer: "Maria Garcia",
    },
    {
      id: 40,
      header: "Mobile Compatibility",
      type: "Technical content",
      status: "Done",
      target: "28",
      limit: "31",
      reviewer: "James Wilson",
    },
    {
      id: 41,
      header: "Data Migration Plan",
      type: "Technical content",
      status: "In Process",
      target: "19",
      limit: "22",
      reviewer: "Assign reviewer",
    },
    {
      id: 42,
      header: "Quality Assurance Protocols",
      type: "Technical content",
      status: "Done",
      target: "30",
      limit: "33",
      reviewer: "Priya Singh",
    },
    {
      id: 43,
      header: "Stakeholder Analysis",
      type: "Research",
      status: "In Process",
      target: "11",
      limit: "14",
      reviewer: "Eddie Lake",
    },
    {
      id: 44,
      header: "Environmental Impact Assessment",
      type: "Research",
      status: "Done",
      target: "24",
      limit: "27",
      reviewer: "Assign reviewer",
    },
    {
      id: 45,
      header: "Intellectual Property Rights",
      type: "Legal",
      status: "In Process",
      target: "17",
      limit: "20",
      reviewer: "Sarah Johnson",
    },
    {
      id: 46,
      header: "Customer Support Framework",
      type: "Narrative",
      status: "Done",
      target: "22",
      limit: "25",
      reviewer: "Jamik Tashpulatov",
    },
    {
      id: 47,
      header: "Version Control Strategy",
      type: "Technical content",
      status: "In Process",
      target: "15",
      limit: "18",
      reviewer: "Assign reviewer",
    },
    {
      id: 48,
      header: "Continuous Integration Pipeline",
      type: "Technical content",
      status: "Done",
      target: "26",
      limit: "29",
      reviewer: "Michael Chen",
    },
    {
      id: 49,
      header: "Regulatory Compliance",
      type: "Legal",
      status: "In Process",
      target: "13",
      limit: "16",
      reviewer: "Assign reviewer",
    },
    {
      id: 50,
      header: "User Authentication System",
      type: "Technical content",
      status: "Done",
      target: "28",
      limit: "31",
      reviewer: "Eddie Lake",
    },
    {
      id: 51,
      header: "Data Analytics Framework",
      type: "Technical content",
      status: "In Process",
      target: "21",
      limit: "24",
      reviewer: "Jamik Tashpulatov",
    },
    {
      id: 52,
      header: "Cloud Infrastructure",
      type: "Technical content",
      status: "Done",
      target: "16",
      limit: "19",
      reviewer: "Assign reviewer",
    },
    {
      id: 53,
      header: "Network Security Measures",
      type: "Technical content",
      status: "In Process",
      target: "29",
      limit: "32",
      reviewer: "Lisa Wong",
    },
    {
      id: 54,
      header: "Project Timeline",
      type: "Planning",
      status: "Done",
      target: "14",
      limit: "17",
      reviewer: "Eddie Lake",
    },
    {
      id: 55,
      header: "Resource Allocation",
      type: "Planning",
      status: "In Process",
      target: "27",
      limit: "30",
      reviewer: "Assign reviewer",
    },
    {
      id: 56,
      header: "Team Structure and Roles",
      type: "Planning",
      status: "Done",
      target: "20",
      limit: "23",
      reviewer: "Jamik Tashpulatov",
    },
    {
      id: 57,
      header: "Communication Protocols",
      type: "Planning",
      status: "In Process",
      target: "15",
      limit: "18",
      reviewer: "Assign reviewer",
    },
    {
      id: 58,
      header: "Success Metrics",
      type: "Planning",
      status: "Done",
      target: "30",
      limit: "33",
      reviewer: "Eddie Lake",
    },
    {
      id: 59,
      header: "Internationalization Support",
      type: "Technical content",
      status: "In Process",
      target: "23",
      limit: "26",
      reviewer: "Jamik Tashpulatov",
    },
    {
      id: 60,
      header: "Backup and Recovery Procedures",
      type: "Technical content",
      status: "Done",
      target: "18",
      limit: "21",
      reviewer: "Assign reviewer",
    },
    {
      id: 61,
      header: "Monitoring and Alerting System",
      type: "Technical content",
      status: "In Process",
      target: "25",
      limit: "28",
      reviewer: "Daniel Park",
    },
    {
      id: 62,
      header: "Code Review Guidelines",
      type: "Technical content",
      status: "Done",
      target: "12",
      limit: "15",
      reviewer: "Eddie Lake",
    },
    {
      id: 63,
      header: "Documentation Standards",
      type: "Technical content",
      status: "In Process",
      target: "27",
      limit: "30",
      reviewer: "Jamik Tashpulatov",
    },
    {
      id: 64,
      header: "Release Management Process",
      type: "Planning",
      status: "Done",
      target: "22",
      limit: "25",
      reviewer: "Assign reviewer",
    },
    {
      id: 65,
      header: "Feature Prioritization Matrix",
      type: "Planning",
      status: "In Process",
      target: "19",
      limit: "22",
      reviewer: "Emma Davis",
    },
    {
      id: 66,
      header: "Technical Debt Assessment",
      type: "Technical content",
      status: "Done",
      target: "24",
      limit: "27",
      reviewer: "Eddie Lake",
    },
    {
      id: 67,
      header: "Capacity Planning",
      type: "Planning",
      status: "In Process",
      target: "21",
      limit: "24",
      reviewer: "Jamik Tashpulatov",
    },
    {
      id: 68,
      header: "Service Level Agreements",
      type: "Legal",
      status: "Done",
      target: "26",
      limit: "29",
      reviewer: "Assign reviewer",
    },
  ];

  const dropExamples = [
    {
      data: {id: 'development-tasks', title: 'Development Tasks', description: 'Technical implementation tasks'},
      nesteds: [
        {id: 'setup-project', title: 'Setup Project', description: 'Initialize repository and configure tools'},
        {id: 'create-components', title: 'Create Components', description: 'Build reusable UI components'},
      ],
    },
    {
      data: {id: 'design-tasks', title: 'Design Tasks', description: 'UI/UX design related tasks'},
      nesteds: [
        {id: 'color-palette', title: 'Color Palette', description: 'Define brand colors and variants'},
        {id: 'typography', title: 'Typography', description: 'Select and implement fonts'},
      ],
    },
  ];

  // Load tasks with relations
  const tasks = await taskRepo.find({
    order: { createdAt: 'DESC' },
    relations: { taskStatus: true, priority: true, creator: true, user: true, parent: true }
  });

  // Load tags per task
  const taskIds = tasks.map(t => t.id);
  const tagsByTask: Record<string, { id: string; slug: string; name: string }[]> = {};

  if (taskIds.length) {
    const links = await taskTagRepo.find({ where: { taskId: In(taskIds) }, relations: { tag: true } });
    for (const link of links) {
      (tagsByTask[link.taskId] ||= []).push({ id: link.tag.id, slug: link.tag.slug, name: link.tag.name });
    }
  }

  const [priorities, states, tags, users] = await Promise.all([
    priorityRepo.find({ order: { rank: 'ASC', name: 'ASC' } }),
    stateRepo.find({ order: { rank: 'ASC', name: 'ASC' } }),
    tagRepo.find({ order: { name: 'ASC' } }),
    userRepo.find({ order: { email: 'ASC' } })
  ]);

  // Build assigned users by task via UserTask links
  const usersByTask: Record<string, string[]> = {};
  if (taskIds.length) {
    const userTaskRepo = AppDataSource.getRepository(UserTask);
    const links = await userTaskRepo.find({ where: { taskId: In(taskIds) }, relations: { user: true } });
    for (const link of links as any[]) {
      const u = link.user as any;
      const name = `${(u?.forename ?? '').trim()} ${(u?.surname ?? '').trim()}`.trim() || u?.email || '';
      if (!usersByTask[link.taskId]) usersByTask[link.taskId] = [];
      if (name) usersByTask[link.taskId].push(name);
    }
  }

  // Helpers local to this page for mapping domain -> table row shape
  function fullNameOrEmail(u?: any): string {
    if (!u) return '';
    const name = `${(u.forename ?? '').trim()} ${(u.surname ?? '').trim()}`.trim();
    return name || u.email || '';
  }
  function extractTypeFromDescription(desc?: string | null): string {
    if (!desc) return '';
    const m = desc.match(/\bType:\s*([^|\n\r]+)/i);
    return (m?.[1]?.trim() ?? '');
  }

  // Projected rows for the task table (kept here per page-owner request)
  const tasksProjected = tasks.map((t, idx) => ({
    // Use a numeric, table-friendly id while we still have UUIDs in the entity
    id: idx + 1,
    header: t.title,
    type: extractTypeFromDescription(t.description) || (t.project?.title ?? ''),
    status: t.taskStatus?.name ?? '',
    priority: t.priority?.name ?? '',
    assignedProject: t.project?.title ?? '',
    plannedSchedule: {
      plannedStart: t.plannedStartDate ?? undefined,
      plannedDue: t.dueDate ?? undefined,
    },
    mainAssignee: fullNameOrEmail(t.user),
    assignedUsers: usersByTask[t.id] ?? [],
    isActive: !!t.isActive,
    created: t.createdAt,
    updated: t.updatedAt,
    tags: (tagsByTask[t.id] ?? []).map((x) => x.name),
  }));

  //debugger;
  return {
    dropContainerItems: dropExamples,
    fakeData: genericListData,
    tasks: genericTaskData,
    tasksProjected,
    priorities: toPlainArray(priorities),
    states: toPlainArray(states),
    tags: toPlainArray(tags),
    users: toPlainArray(users),
    user: locals.user,
    mTasks: toPlainArray(tasks)
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { message: 'Not authenticated' });

    const form = await request.formData();
    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim() || null;
    const isDone = form.get('isDone') === 'on';
    const priorityId = String(form.get('priorityId') ?? null);
    const taskStatusId = String(form.get('taskStatusId') ?? '');
    const dueDateStr = String(form.get('dueDate') ?? '').trim();
    const plannedStartDateStr = String(form.get('plannedStartDate') ?? '').trim();
    const isActive = form.get('isActive') ? form.get('isActive') === 'on' : true;
    const isMeta = form.get('isMeta') === 'on';
    const parentTaskId = String(form.get('parentTaskId') ?? null);
    const tagsCSV = String(form.get('tags') ?? '').trim();

    if (!title) return fail(400, { message: 'Title is required' });
    if (!plannedStartDateStr) return fail(400, { message: 'Planned start date is required' });
    if (!dueDateStr) return fail(400, { message: 'Due date is required' });
    if (!taskStatusId) return fail(400, { message: 'Task state is required' });

    await initializeDatabase();

    const userRepo = AppDataSource.getRepository(User);
    const creator = await userRepo.findOne({ where: { email: locals.user.email } });

    const taskRepo = AppDataSource.getRepository(Task);
    const task = taskRepo.create({
      title,
      description: description ?? undefined,
      isDone,
      isActive,
      isMeta,
      priority: priorityId ? ({ id: priorityId } as any) : undefined,
      taskStatus: { id: taskStatusId } as any,
      plannedStartDate: new Date(plannedStartDateStr),
      dueDate: new Date(dueDateStr),
      parent: parentTaskId ? ({ id: parentTaskId } as any) : undefined,
      creator: creator ?? undefined
    });

    await taskRepo.save(task);

    // handle tags
    const tagRepo = AppDataSource.getRepository(Tag);
    const taskTagRepo = AppDataSource.getRepository(TaskTag);
    const tags = tagsCSV ? tagsCSV.split(',').map(t => t.trim()).filter(Boolean) : [];

    for (const t of tags) {
      const slug = slugifyTag(t);
      let tag = await tagRepo.findOne({ where: { slug } });
      if (!tag) {
        tag = tagRepo.create({ slug, name: t });
        await tagRepo.save(tag);
      }
      const existing = await taskTagRepo.findOne({ where: { taskId: task.id, tagId: tag.id } });
      if (!existing) {
        await taskTagRepo.save(taskTagRepo.create({ taskId: task.id, tagId: tag.id }));
      }
    }

    return { success: true, message: 'Task created' };
  },

  toggle: async ({ request }) => {
    await initializeDatabase();
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    const isDone = form.get('isDone') === 'true';

    if (!id) return fail(400, { message: 'Task id required' });

    const repo = AppDataSource.getRepository(Task);
    await repo.update(id, { isDone });

    return { success: true, message: 'Task updated' };
  },

  tag: async ({ request }) => {
    await initializeDatabase();
    const form = await request.formData();
    const taskId = String(form.get('taskId') ?? '');
    const tagName = String(form.get('tag') ?? '').trim();

    if (!taskId || !tagName) return fail(400, { message: 'Task and tag required' });

    const slug = slugifyTag(tagName);
    const tagRepo = AppDataSource.getRepository(Tag);
    const taskTagRepo = AppDataSource.getRepository(TaskTag);

    let tag = await tagRepo.findOne({ where: { slug } });
    if (!tag) {
      tag = tagRepo.create({ slug, name: tagName });
      await tagRepo.save(tag);
    }

    const existing = await taskTagRepo.findOne({ where: { taskId, tagId: tag.id } });
    if (!existing) {
      await taskTagRepo.save(taskTagRepo.create({ taskId, tagId: tag.id }));
    }

    return { success: true, message: 'Tag added' };
  }
};
