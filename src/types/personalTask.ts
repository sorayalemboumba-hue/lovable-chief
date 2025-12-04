export interface PersonalTask {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  url?: string;
  done: boolean;
  createdAt: string;
}
