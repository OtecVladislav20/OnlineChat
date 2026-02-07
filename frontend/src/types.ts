export type Workspace = {
  _id: string;
  name: string;
  ownerId: string;
  createdAt: string;
};

export type Channel = {
  _id: string;
  workspaceId: string;
  name: string;
  type: "text" | "voice";
  createdAt: string;
};

export type Message = {
  _id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: string;
  editedAt?: string | null;
};

