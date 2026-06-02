export async function humanApprovalAgent() {
  return { success: true, waitingApproval: true, data: { checkpoint: "human_approval" } };
}
