// src/lib/graphql.ts
import { gql, type TypedDocumentNode } from '@apollo/client'

/* ========= Scalars & TS helpers ========= */
export type ID = string
export type DateTime = string

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'
export type TaskStatus = 'TODO' | 'DOING' | 'DONE'

/* ========= Entities ========= */
export interface User {
  __typename?: 'User'
  id: ID
  email: string
  name: string
  createdAt: DateTime
}

export interface Team {
  __typename?: 'Team'
  id: ID
  name: string
  slug: string
  createdAt: DateTime
}

export interface Project {
  __typename?: 'Project'
  id: ID
  teamId: ID
  name: string
  key: string
  createdAt: DateTime
}

export interface Document {
  __typename?: 'Document'
  id: ID
  projectId: ID
  title: string
  content: string
  createdAt: DateTime
  updatedAt: DateTime
}

export interface Channel {
  __typename?: 'Channel'
  id: ID
  projectId: ID
  name: string
  createdAt: DateTime
}

export interface Message {
  __typename?: 'Message'
  id: ID
  channelId: ID
  author: User
  body: string
  createdAt: DateTime
}

export interface Task {
  __typename?: 'Task'
  id: ID
  projectId: ID
  title: string
  description: string
  status: TaskStatus
  priority: number
  dueAt: DateTime | null
  createdAt: DateTime
  updatedAt: DateTime
  assignees: User[]
}

/* ========= Fragments ========= */
export type UserFieldsFragment = Pick<User, 'id' | 'email' | 'name'>

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    email
    name
  }
`

/* ========= Auth ========= */
export type SignUpMutation = {
  signUp: { token: string; user: UserFieldsFragment }
}
export type SignUpVariables = {
   input: { email: string; name: string; password: string }
}
export const SIGN_UP: TypedDocumentNode<SignUpMutation, SignUpVariables> = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`

export type SignInMutation = {
  signIn: { token: string; user: UserFieldsFragment }
}
export type SignInVariables = {  input: { email: string; password: string }  }
export const SIGN_IN: TypedDocumentNode<SignInMutation, SignInVariables> = gql`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`

export type MeQuery = { currentUser: UserFieldsFragment | null }
export type MeVariables = Record<string, never>
export const ME: TypedDocumentNode<MeQuery, MeVariables> = gql`
  query Me {
    currentUser {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`

/* ========= Teams & Projects ========= */
export type TeamsQuery = {
  teams: Array<Pick<Team, 'id' | 'name' | 'slug'>>
}
export type TeamsVariables = Record<string, never>
export const TEAMS: TypedDocumentNode<TeamsQuery, TeamsVariables> = gql`
  query Teams {
    teams {
      id
      name
      slug
    }
  }
`

export type ProjectsQuery = {
  projects: Array<Pick<Project, 'id' | 'name' | 'key' | 'teamId'>>
}
export type ProjectsVariables = { teamId: ID }
export const PROJECTS: TypedDocumentNode<ProjectsQuery, ProjectsVariables> = gql`
  query Projects($teamId: ID!) {
    projects(teamId: $teamId) {
      id
      name
      key
      teamId
    }
  }
`

export type CreateProjectMutation = {
  createProject: Pick<Project, 'id' | 'name' | 'key' | 'teamId'>
}
export type CreateProjectVariables = {
  input: {   teamId: ID; name: string; key: string  }
}
export const CREATE_PROJECT: TypedDocumentNode<
  CreateProjectMutation,
  CreateProjectVariables
> = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      key
      teamId
    }
  }
`

export type DeleteProjectMutation = { deleteProject: boolean }
export type DeleteProjectVariables = { projectId: ID }
export const DELETE_PROJECT: TypedDocumentNode<
  DeleteProjectMutation,
  DeleteProjectVariables
> = gql`
  mutation DeleteProject($projectId: ID!) {
    deleteProject(projectId: $projectId)
  }
`

/* ========= Documents ========= */
export type DocumentsQuery = {
  documents: Array<Pick<Document, 'id' | 'title' | 'updatedAt'>>
}
export type DocumentsVariables = { projectId: ID }
export const DOCUMENTS: TypedDocumentNode<DocumentsQuery, DocumentsVariables> =
  gql`
    query Documents($projectId: ID!) {
      documents(projectId: $projectId) {
        id
        title
        updatedAt
      }
    }
  `

export type DocumentByIdQuery = { document: Document | null }
export type DocumentByIdVariables = { id: ID }
export const DOCUMENT_BY_ID: TypedDocumentNode<
  DocumentByIdQuery,
  DocumentByIdVariables
> = gql`
  query DocumentById($id: ID!) {
    document(id: $id) {
      id
      projectId
      title
      content
      createdAt
      updatedAt
    }
  }
`

export type DocumentQuery = { document: Document | null }
export type DocumentVariables = { id: ID }
export const DOCUMENT: TypedDocumentNode<DocumentQuery, DocumentVariables> = gql`
  query Document($id: ID!) {
    document(id: $id) {
      id
      projectId
      title
      content
      createdAt
      updatedAt
    }
  }
`

export type CreateDocumentMutation = {
  createDocument: Pick<Document, 'id' | 'title' | 'updatedAt'>
}
export type CreateDocumentVariables = {
    input: { projectId: ID; title: string; content?: string | null }
}
export const CREATE_DOCUMENT: TypedDocumentNode<
  CreateDocumentMutation,
  CreateDocumentVariables
> = gql`
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      id
      title
      updatedAt
    }
  }
`

export type UpdateDocumentMutation = { updateDocument: Document }
export type UpdateDocumentVariables = {
  input: { id: ID; title?: string | null; content?: string | null }
}
export const UPDATE_DOCUMENT: TypedDocumentNode<
  UpdateDocumentMutation,
  UpdateDocumentVariables
> = gql`
  mutation UpdateDocument($input: UpdateDocumentInput!) {
    updateDocument(input: $input) {
      id
      projectId
      title
      content
      createdAt
      updatedAt
    }
  }
`

export type UpdateDocumentContentMutation = {
  updateDocumentContent: Pick<Document, 'id' | 'updatedAt'>
}
export type UpdateDocumentContentVariables = { id: ID; content: string }
export const UPDATE_DOCUMENT_CONTENT: TypedDocumentNode<
  UpdateDocumentContentMutation,
  UpdateDocumentContentVariables
> = gql`
  mutation UpdateDocumentContent($id: ID!, $content: String!) {
    updateDocumentContent(id: $id, content: $content) {
      id
      updatedAt
    }
  }
`

export type DeleteDocumentMutation = { deleteDocument: boolean }
export type DeleteDocumentVariables = { id: ID }
export const DELETE_DOCUMENT: TypedDocumentNode<
  DeleteDocumentMutation,
  DeleteDocumentVariables
> = gql`
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`

/* ========= Chat ========= */
export type ChannelsQuery = {
  channels: Array<Pick<Channel, 'id' | 'name'>>
}
export type ChannelsVariables = { projectId: ID }
export const CHANNELS: TypedDocumentNode<ChannelsQuery, ChannelsVariables> = gql`
  query Channels($projectId: ID!) {
    channels(projectId: $projectId) {
      id
      name
    }
  }
`

export type CreateChannelMutation = {
  createChannel: Pick<Channel, 'id' | 'name'>
}
export type CreateChannelVariables = { input: { projectId: ID; name: string } }
export const CREATE_CHANNEL: TypedDocumentNode<
  CreateChannelMutation,
  CreateChannelVariables
> = gql`
  mutation CreateChannel($input: CreateChannelInput!) {
    createChannel(input: $input) {
      id
      name
    }
  }
`

export type DeleteChannelMutation = { deleteChannel: boolean }
export type DeleteChannelVariables = { channelId: ID }
export const DELETE_CHANNEL: TypedDocumentNode<
  DeleteChannelMutation,
  DeleteChannelVariables
> = gql`
  mutation DeleteChannel($channelId: ID!) {
    deleteChannel(channelId: $channelId)
  }
`

export type MessagesQuery = {
  messages: Array<{
    id: ID
    body: string
    createdAt: DateTime
    author: UserFieldsFragment
  }>
}
export type MessagesVariables = { channelId: ID }
export const MESSAGES: TypedDocumentNode<MessagesQuery, MessagesVariables> = gql`
  query Messages($channelId: ID!) {
    messages(channelId: $channelId) {
      id
      body
      createdAt
      author {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`

export type SendMessageMutation = {
  sendMessage: {
    id: ID
    body: string
    createdAt: DateTime
    author: UserFieldsFragment
  }
}
export type SendMessageVariables = {  input: { channelId: ID; body: string }  }
export const SEND_MESSAGE: TypedDocumentNode<
  SendMessageMutation,
  SendMessageVariables
> = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      body
      createdAt
      author {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`

export type MessageAddedSubscription = {
  messageAdded: {
    id: ID
    body: string
    createdAt: DateTime
    author: UserFieldsFragment
  }
}
export type MessageAddedVariables = { channelId: ID }
export const MESSAGE_ADDED: TypedDocumentNode<
  MessageAddedSubscription,
  MessageAddedVariables
> = gql`
  subscription MessageAdded($channelId: ID!) {
    messageAdded(channelId: $channelId) {
      id
      body
      createdAt
      author {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`

/* ========= Tasks ========= */
export type TasksQuery = {
  tasks: Array<Pick<Task, 'id' | 'title' | 'status' | 'priority'>>
}
export type TasksVariables = { projectId: ID }
export const TASKS: TypedDocumentNode<TasksQuery, TasksVariables> = gql`
  query Tasks($projectId: ID!) {
    tasks(projectId: $projectId) {
      id
      title
      status
      priority
    }
  }
`

export type AddTaskMutation = {
  addTask: Pick<Task, 'id' | 'title' | 'status'>
}
export type AddTaskVariables = {
  input: {
    projectId: ID
    title: string
    description?: string | null
    priority?: number | null
    dueAt?: DateTime | null
  }
}
export const ADD_TASK: TypedDocumentNode<AddTaskMutation, AddTaskVariables> = gql`
  mutation AddTask($input: AddTaskInput!) {
    addTask(input: $input) {
      id
      title
      status
    }
  }
`

export type UpdateTaskMutation = { updateTask: Task }
export type UpdateTaskVariables = {
  input: {
    id: ID
    title?: string | null
    description?: string | null
    status?: TaskStatus | null
    priority?: number | null
    dueAt?: DateTime | null
  }
}
export const UPDATE_TASK: TypedDocumentNode<
  UpdateTaskMutation,
  UpdateTaskVariables
> = gql`
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      id
      projectId
      title
      description
      status
      priority
      dueAt
      createdAt
      updatedAt
      assignees {
        id
        email
        name
        createdAt
      }
    }
  }
`

export type AssignTaskMutation = { assignTask: Task }
export type AssignTaskVariables = { input: { taskId: ID; userIds: ID[] } }
export const ASSIGN_TASK: TypedDocumentNode<
  AssignTaskMutation,
  AssignTaskVariables
> = gql`
  mutation AssignTask($input: AssignTaskInput!) {
    assignTask(input: $input) {
      id
      projectId
      title
      description
      status
      priority
      dueAt
      createdAt
      updatedAt
      assignees {
        id
        email
        name
        createdAt
      }
    }
  }
`

export type DeleteTaskMutation = { deleteTask: boolean }
export type DeleteTaskVariables = { taskId: ID }
export const DELETE_TASK: TypedDocumentNode<
  DeleteTaskMutation,
  DeleteTaskVariables
> = gql`
  mutation DeleteTask($taskId: ID!) {
    deleteTask(taskId: $taskId)
  }
`

export type UpdateTaskStatusMutation = {
  updateTaskStatus: {
    id: ID
    status: TaskStatus
    updatedAt: DateTime
    projectId: ID
    title: string
  }
}
export type UpdateTaskStatusVariables = { id: ID; status: TaskStatus }
export const UPDATE_TASK_STATUS: TypedDocumentNode<
  UpdateTaskStatusMutation,
  UpdateTaskStatusVariables
> = gql`
  mutation UpdateTaskStatus($id: ID!, $status: TaskStatus!) {
    updateTaskStatus(id: $id, status: $status) {
      id
      status
      updatedAt
      projectId
      title
    }
  }
`

/* ========= Task Subscriptions ========= */
export type TaskAddedSubscription = {
  taskAdded: {
    id: ID
    title: string
    status: TaskStatus
    priority: number
    projectId: ID
  }
}
export type TaskAddedVariables = { projectId: ID }
export const TASK_ADDED_SUB: TypedDocumentNode<
  TaskAddedSubscription,
  TaskAddedVariables
> = gql`
  subscription TaskAdded($projectId: ID!) {
    taskAdded(projectId: $projectId) {
      id
      title
      status
      priority
      projectId
    }
  }
`

export type TaskUpdatedSubscription = {
  taskUpdated: {
    id: ID
    title: string
    status: TaskStatus
    priority: number
    projectId: ID
  }
}
export type TaskUpdatedVariables = { projectId: ID }
export const TASK_UPDATED_SUB: TypedDocumentNode<
  TaskUpdatedSubscription,
  TaskUpdatedVariables
> = gql`
  subscription TaskUpdated($projectId: ID!) {
    taskUpdated(projectId: $projectId) {
      id
      title
      status
      priority
      projectId
    }
  }
`
