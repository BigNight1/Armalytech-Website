/** Identifies the admin performing a stock-affecting operation, for the movement's audit trail. */
export interface Actor {
  userId: string;
  userEmail: string;
}
