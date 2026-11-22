import assert from "node:assert/strict";
import test from "node:test";
import { cadenceDecision, linkedInDecision, newsletterDecision } from "../communications/rehearsal.mjs";

const issue = {
  customerDelivered: false, held: false, exclusiveWriter: true, intentUnresolved: false,
  audienceVerified: true, eligibleCount: 3, providerState: "draft", contentVersion: "v2",
  previewVersion: "v2", previewDeliveredAt: "2026-12-01T16:20:00Z",
  proposedSendAt: "2026-12-03T16:20:00Z"
};
const scheduled = {
  providerState: "scheduled", providerVersion: "v2", scheduledAudienceMatches: true,
  providerScheduledAt: issue.proposedSendAt
};
const slot = {
  exclusiveWriter: true, queuesReconciled: true, unresolvedWrite: false, sameRemotePost: false,
  bylineVerified: true, mediaAndLinkVerified: true, reserved: false, blackout: false, occupied: false
};

const reader = {
  humanVerified: true, excluded: false, optedOut: false, suppressed: false,
  consentVerified: true, editionAlreadyCommitted: false, weeklyPermission: false,
  monthlyPermission: true, monthlyDeliveryAlreadyCommitted: false
};
for (const [expected, firstTuesday, changes] of [
  ["monthly", true, {}], ["exclude", false, {}], ["weekly", false, { weeklyPermission: true }],
  ["weekly", true, { weeklyPermission: true }], ["exclude", true, { monthlyDeliveryAlreadyCommitted: true }],
  ["exclude", true, { optedOut: true, weeklyPermission: true }], ["exclude", true, { suppressed: true }],
  ["exclude", true, { excluded: true }], ["exclude", true, { consentVerified: false }],
  ["exclude", true, { editionAlreadyCommitted: true }], ["exclude", true, { humanVerified: undefined }]
]) {
  test("cadence " + expected + " monthly cycle " + firstTuesday + " " + JSON.stringify(changes), () => {
    assert.equal(cadenceDecision({ ...reader, ...changes }, firstTuesday), expected);
  });
}

for (const [expected, changes] of [
  ["standby", { exclusiveWriter: false }], ["check-hold", { held: true }],
  ["reconcile-provider", { intentUnresolved: true }], ["reconcile-provider", { providerState: "unknown" }],
  ["reconcile-audience", { audienceVerified: false }], ["reconcile-audience", { eligibleCount: null }],
  ["preview-owner", { previewVersion: "v1" }], ["preview-owner", { previewDeliveredAt: null }],
  ["owner-only", { eligibleCount: 0 }], ["move-send-later", { proposedSendAt: "2026-12-03T16:19:59Z" }],
  ["ready-to-schedule", {}], ["monitor-existing", scheduled],
  ["hold-existing-and-reconcile", { ...scheduled, eligibleCount: 0 }],
  ["hold-existing-and-reconcile", { ...scheduled, scheduledAudienceMatches: false }],
  ["hold-existing-and-reconcile", { ...scheduled, providerVersion: "v1" }],
  ["hold-existing-and-reconcile", { ...scheduled, providerScheduledAt: issue.previewDeliveredAt }],
  ["review-delivery", { customerDelivered: true, eligibleDelivery: false }],
  ["reconcile-archive", { customerDelivered: true, customerIdentityVerified: true, eligibleDelivery: true }],
  ["complete", { customerDelivered: true, customerIdentityVerified: true, eligibleDelivery: true, archived: true }]
]) {
  test("newsletter " + expected + " " + JSON.stringify(changes), () => {
    assert.equal(newsletterDecision({ ...issue, ...changes }), expected);
  });
}
for (const [expected, changes] of [
  ["ready-to-schedule", {}], ["standby", { exclusiveWriter: false }],
  ["reconcile-provider", { unresolvedWrite: true }], ["reconcile-provider", { queuesReconciled: false }],
  ["resume-existing", { sameRemotePost: true, occupied: true }],
  ["find-eligible-slot", { blackout: true }], ["find-eligible-slot", { reserved: true }],
  ["find-eligible-slot", { occupied: true }], ["review-draft", { bylineVerified: false }],
  ["review-draft", { mediaAndLinkVerified: false }]
]) {
  test("LinkedIn " + expected + " " + JSON.stringify(changes), () => {
    assert.equal(linkedInDecision({ ...slot, ...changes }), expected);
  });
}
