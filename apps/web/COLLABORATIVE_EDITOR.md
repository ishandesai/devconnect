# DevConnect Collaborative Document Editor

This document describes the collaborative document editor feature in DevConnect, powered by Liveblocks and TipTap.

## Features

### ✨ Real-time Collaboration

- **Live cursors**: See where other users are editing in real-time
- **Presence indicators**: View who's currently editing the document
- **Conflict resolution**: Automatic handling of simultaneous edits
- **Offline support**: Changes sync when connection is restored

### 📝 Rich Text Editing

- **Formatting**: Bold, italic, strikethrough
- **Headings**: H1, H2, H3 support
- **Lists**: Bullet and numbered lists
- **Code blocks**: Syntax highlighting for code
- **Blockquotes**: For highlighting important text

### 💾 Auto-save & Persistence

- **Auto-save**: Documents save automatically as you type
- **Database persistence**: All changes are stored in PostgreSQL
- **Version history**: Liveblocks manages document history
- **Save indicators**: Visual feedback for save status

### 🔐 Security & Permissions

- **Team-based access**: Only team members can edit documents
- **Project isolation**: Documents are scoped to projects
- **Authentication**: JWT-based user authentication
- **Authorization**: GraphQL resolvers enforce permissions

## Architecture

### Frontend (Next.js + React)

- **TipTap Editor**: Rich text editor with Liveblocks integration
- **Liveblocks React**: Real-time collaboration hooks
- **Apollo Client**: GraphQL data fetching and caching
- **Tailwind CSS**: Styling and responsive design

### Backend (Fastify + GraphQL)

- **Liveblocks Node SDK**: Server-side authentication and room management
- **Prisma**: Database ORM for document persistence
- **PostgreSQL**: Document storage and metadata
- **GraphQL**: API for document CRUD operations

### Real-time Layer

- **Liveblocks**: Handles real-time collaboration, cursors, and presence
- **WebSocket connections**: Persistent connections for live updates
- **Room-based isolation**: Each document is a separate Liveblocks room

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the web app root:

```bash
# Liveblocks Configuration
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=your_liveblocks_public_key
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 2. Liveblocks Setup

1. Sign up at [liveblocks.io](https://liveblocks.io)
2. Create a new project
3. Get your public and secret keys
4. Add them to your environment variables

### 3. Database Setup

The collaborative editor uses the existing Prisma schema. Make sure your database is migrated:

```bash
cd apps/api
npx prisma migrate dev
```

### 4. Start the Development Servers

```bash
# Start the API server
cd apps/api
npm run dev

# Start the web app
cd apps/web
npm run dev
```

## Usage

### Creating Documents

1. Navigate to a project in DevConnect
2. Go to the "Docs" tab
3. Click "New Doc" to create a new document
4. Enter a title and start editing

### Collaborative Editing

1. Open a document to start editing
2. Other team members can join by opening the same document
3. See real-time cursors and presence indicators
4. Changes are automatically saved and synced

### Document Management

- **List view**: See all documents in a project
- **Search**: Find documents by title
- **Recent**: Recently updated documents appear first
- **Permissions**: Only team members can access project documents

## API Reference

### GraphQL Queries

```graphql
# Get all documents in a project
query Documents($projectId: ID!) {
  documents(projectId: $projectId) {
    id
    title
    updatedAt
  }
}

# Get a specific document
query DocumentById($id: ID!) {
  document(id: $id) {
    id
    title
    content
    updatedAt
  }
}
```

### GraphQL Mutations

```graphql
# Create a new document
mutation CreateDocument($projectId: ID!, $title: String!, $content: String) {
  createDocument(
    input: { projectId: $projectId, title: $title, content: $content }
  ) {
    id
    title
  }
}

# Update document content
mutation UpdateDocument($id: ID!, $title: String, $content: String) {
  updateDocument(input: { id: $id, title: $title, content: $content }) {
    id
    title
    content
  }
}
```

## Customization

### Adding New Formatting Options

To add new formatting options to the editor toolbar:

1. Install the TipTap extension:

```bash
npm install @tiptap/extension-[extension-name]
```

2. Add it to the editor configuration in `EnhancedEditor.tsx`:

```typescript
import NewExtension from '@tiptap/extension-[extension-name]';

const editor = useEditor({
  extensions: [
    liveblocks,
    StarterKit,
    NewExtension, // Add your extension here
  ],
  // ... rest of config
});
```

3. Add toolbar buttons for the new formatting option.

### Styling Customization

The editor uses Tailwind CSS classes. You can customize the appearance by modifying the classes in:

- `EnhancedEditor.tsx` - Main editor component
- `DocList.tsx` - Document list sidebar
- `DocsClient.tsx` - Main docs container

### Liveblocks Configuration

Customize Liveblocks behavior in `liveblocks.config.ts`:

```typescript
export const client = createClient({
  authEndpoint: async (room) => {
    // Custom authentication logic
  },
  // Add other Liveblocks configuration options
});
```

## Troubleshooting

### Common Issues

1. **Documents not saving**: Check that the `LIVEBLOCKS_SECRET_KEY` is set correctly
2. **Real-time updates not working**: Verify the `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` is set
3. **Authentication errors**: Ensure the JWT token is being sent correctly
4. **Database errors**: Check that Prisma migrations are up to date

### Debug Mode

Enable Liveblocks debug mode by adding to your environment:

```bash
NEXT_PUBLIC_LIVEBLOCKS_DEBUG=true
```

This will show detailed logs in the browser console.

## Performance Considerations

- **Document size**: Large documents may impact performance
- **Concurrent users**: Many simultaneous editors may slow down real-time sync
- **Network**: Poor connections may cause sync delays
- **Browser limits**: Some browsers have WebSocket connection limits

## Security Notes

- Documents are scoped to team projects
- Only authenticated team members can access documents
- All real-time communication is encrypted
- Document content is stored securely in the database

## Future Enhancements

- **Comments system**: Add threaded comments to documents
- **Version history**: View and restore previous document versions
- **Export options**: Export documents to PDF, Word, etc.
- **Templates**: Pre-built document templates
- **Advanced formatting**: Tables, images, links, etc.
- **Mobile support**: Optimized mobile editing experience
