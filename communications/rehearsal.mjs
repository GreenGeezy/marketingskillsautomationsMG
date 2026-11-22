/**
 * Offline decision examples for successor agents. Inputs are already reconciled
 * privately. These functions do not contact a provider or authorize a write.
 */
export function newsletterDecision(evidence) {
  if (evidence.customerDelivered === true) {
    if (evidence.customerIdentityVerified !== true || evidence.eligibleDelivery !== true) return "review-delivery";
    return evidence.archived === true ? "complete" : "reconcile-archive";
  }
  if (evidence.held !== false) return "check-hold";
  if (evidence.exclusiveWriter !== true) return "standby";
  if (evidence.intentUnresolved !== false) return "reconcile-provider";
  if (evidence.audienceVerified !== true || !Number.isSafeInteger(evidence.eligibleCount) || evidence.eligibleCount < 0) return "reconcile-audience";
  // A stale scheduled version must be withdrawn even if its audience became empty.
  const previewTime = Date.parse(evidence.previewDeliveredAt);
  const reviewed = Number.isFinite(previewTime) && Boolean(evidence.contentVersion)
    && evidence.previewVersion === evidence.contentVersion;
  if (evidence.providerState === "scheduled") {
    const scheduledTime = Date.parse(evidence.providerScheduledAt);
    const scheduleValid = reviewed && evidence.eligibleCount > 0
      && evidence.providerVersion === evidence.contentVersion
      && evidence.scheduledAudienceMatches === true
      && scheduledTime >= previewTime + 48 * 60 * 60 * 1000;
    return scheduleValid ? "monitor-existing" : "hold-existing-and-reconcile";
  }
  if (evidence.providerState !== "draft") return "reconcile-provider";
  if (!reviewed) return "preview-owner";
  if (evidence.eligibleCount === 0) return "owner-only";
  const proposedTime = Date.parse(evidence.proposedSendAt);
  return proposedTime >= previewTime + 48 * 60 * 60 * 1000 ? "ready-to-schedule" : "move-send-later";
}

export function linkedInDecision(slot) {
  if (slot.exclusiveWriter !== true) return "standby";
  if (slot.queuesReconciled !== true || slot.unresolvedWrite !== false) return "reconcile-provider";
  if (slot.sameRemotePost === true) return "resume-existing";
  if (slot.bylineVerified !== true || slot.mediaAndLinkVerified !== true) return "review-draft";
  if (slot.reserved !== false || slot.blackout !== false || slot.occupied !== false) return "find-eligible-slot";
  return "ready-to-schedule";
}

// One pre-reconciled record per person. The caller supplies the actual
// issue-cycle and delivery-month evidence from the private audience ledger.
export function cadenceDecision(reader, firstTuesdayCycle) {
  if (reader.humanVerified !== true || reader.excluded !== false || reader.suppressed !== false
      || reader.optedOut !== false || reader.consentVerified !== true) return "exclude";
  if (reader.editionAlreadyCommitted !== false) return "exclude";
  if (reader.weeklyPermission === true) return "weekly";
  if (reader.monthlyPermission === true && firstTuesdayCycle === true
      && reader.monthlyDeliveryAlreadyCommitted === false) return "monthly";
  return "exclude";
}
