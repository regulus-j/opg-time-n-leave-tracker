export const transitions = Object.freeze({
  leave: {
    submit: ["draft", "pending"],
    withdraw: ["pending", "withdrawn"],
    cancel: ["approved", "cancelled"],
    approve: ["pending", "approved"],
    reject: ["pending", "rejected"],
    "force-approve": ["pending", "approved"],
  },
  adjustment: {
    submit: ["draft", "pending"],
    withdraw: ["pending", "withdrawn"],
    approve: ["pending", "approved"],
    reject: ["pending", "rejected"],
  },
  alert: {
    acknowledge: ["open", "acknowledged"],
    resolve: ["acknowledged", "resolved"],
  },
});
