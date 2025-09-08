export const typeDefs = `#graphql
  scalar DateTime

  enum Role { OWNER ADMIN MEMBER GUEST }
  enum TaskStatus { TODO DOING DONE }

  type User { id: ID! email: String! name: String! createdAt: DateTime! }
  type Team { id: ID! name: String! slug: String! createdAt: DateTime! projects: [Project!]! }
  type Project { id: ID! teamId: ID! name: String! key: String! createdAt: DateTime! documents: [Document!]! channels: [Channel!]! tasks: [Task!]! }
  type Document { id: ID! projectId: ID! title: String! content: String! createdAt: DateTime! updatedAt: DateTime! }
  type Channel { id: ID! projectId: ID! name: String! createdAt: DateTime! }
  type Message { id: ID! channelId: ID! author: User! body: String! createdAt: DateTime! }
  type Task { id: ID! projectId: ID! title: String! description: String! status: TaskStatus! priority: Int! dueAt: DateTime createdAt: DateTime! updatedAt: DateTime! assignees: [User!]! }

  type AuthPayload { token: String!, user: User! }

  input SignUpInput { email: String!, name: String!, password: String! }
  input SignInInput { email: String!, password: String! }

  input CreateTeamInput { name: String!, slug: String! }
  input AddMemberInput { teamId: ID!, userId: ID!, role: Role! }

  input CreateProjectInput { teamId: ID!, name: String!, key: String! }
  input CreateDocumentInput { projectId: ID!, title: String!, content: String }
  input CreateChannelInput { projectId: ID!, name: String! }
  input SendMessageInput { channelId: ID!, body: String! }
  input AddTaskInput { projectId: ID!, title: String!, description: String, priority: Int, dueAt: DateTime }
  input UpdateTaskInput { id: ID!, title: String, description: String, status: TaskStatus, priority: Int, dueAt: DateTime }
  input AssignTaskInput { taskId: ID!, userIds: [ID!]! }

  type Query {
    currentUser: User
    teamById(id: ID!): Team
    teams: [Team!]!
    projects(teamId: ID!): [Project!]!
    documents(projectId: ID!): [Document!]!
    channels(projectId: ID!): [Channel!]!
    messages(channelId: ID!, limit: Int = 50): [Message!]!
    tasks(projectId: ID!): [Task!]!
  }

  type Mutation {
    signUp(input: SignUpInput!): AuthPayload!
    signIn(input: SignInInput!): AuthPayload!

    createTeam(input: CreateTeamInput!): Team!
    addMember(input: AddMemberInput!): Boolean!

    createProject(input: CreateProjectInput!): Project!
    createDocument(input: CreateDocumentInput!): Document!
    createChannel(input: CreateChannelInput!): Channel!
    sendMessage(input: SendMessageInput!): Message!

    addTask(input: AddTaskInput!): Task!
    updateTask(input: UpdateTaskInput!): Task!
    assignTask(input: AssignTaskInput!): Task!
  }
`;
