import { generateInvitation } from '../../auth/api/authApi.js';

export function generateInvitationLink() {
  return generateInvitation();
}
