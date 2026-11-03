export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
  id?: string;
  redirectTo?: string;
}
