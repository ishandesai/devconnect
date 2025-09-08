import { gql } from '@apollo/client';

// ---------- Fragments ----------
export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    email
    name
  }
`;

// ---------- Auth ----------
export const SIGN_UP = gql`
  mutation SignUp($email: String!, $name: String!, $password: String!) {
    signUp(input: { email: $email, name: $name, password: $password }) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const SIGN_IN = gql`
  mutation SignIn($email: String!, $password: String!) {
    signIn(input: { email: $email, password: $password }) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const ME = gql`
  query Me {
    currentUser {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

// ---------- Teams & Projects ----------
export const TEAMS = gql`
  query Teams {
    teams {
      id
      name
      slug
    }
  }
`;

export const PROJECTS = gql`
  query Projects($teamId: ID!) {
    projects(teamId: $teamId) {
      id
      name
      key
      teamId
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($teamId: ID!, $name: String!, $key: String!) {
    createProject(input: { teamId: $teamId, name: $name, key: $key }) {
      id
      name
      key
      teamId
    }
  }
`;

// ---------- Docs ----------
export const DOCUMENTS = gql`
  query Documents($projectId: ID!) {
    documents(projectId: $projectId) {
      id
      title
    }
  }
`;

export const CREATE_DOCUMENT = gql`
  mutation CreateDocument($projectId: ID!, $title: String!, $content: String) {
    createDocument(
      input: { projectId: $projectId, title: $title, content: $content }
    ) {
      id
      title
    }
  }
`;

// ---------- Chat ----------
export const CHANNELS = gql`
  query Channels($projectId: ID!) {
    channels(projectId: $projectId) {
      id
      name
    }
  }
`;

export const CREATE_CHANNEL = gql`
  mutation CreateChannel($projectId: ID!, $name: String!) {
    createChannel(input: { projectId: $projectId, name: $name }) {
      id
      name
    }
  }
`;

export const MESSAGES = gql`
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
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($channelId: ID!, $body: String!) {
    sendMessage(input: { channelId: $channelId, body: $body }) {
      id
      body
      createdAt
      author {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;
export const MESSAGE_ADDED = gql`
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
`;

// ---------- Tasks ----------
export const TASKS = gql`
  query Tasks($projectId: ID!) {
    tasks(projectId: $projectId) {
      id
      title
      status
      priority
    }
  }
`;

export const ADD_TASK = gql`
  mutation AddTask(
    $projectId: ID!
    $title: String!
    $description: String
    $priority: Int
  ) {
    addTask(
      input: {
        projectId: $projectId
        title: $title
        description: $description
        priority: $priority
      }
    ) {
      id
      title
      status
    }
  }
`;
