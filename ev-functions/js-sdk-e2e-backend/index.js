exports.handler = async (data) => {
  if (data.encrypted && data.unencrypted) {
    const unencryptedType = typeof data.unencrypted;
    if (
      unencryptedType === "string" ||
      unencryptedType === "number" ||
      unencryptedType === "boolean"
    ) {
      if (
        typeof data.encrypted === unencryptedType &&
        data.encrypted === data.unencrypted
      ) {
        return {
          success: true,
          message: `Decryption successful`,
        };
      }
    } else if (unencryptedType === "object") {
      if (JSON.stringify(data.encrypted) === JSON.stringify(data.unencrypted)) {
        return {
          success: true,
          message: `Decryption successful`,
        };
      }
    } else {
      return {
        success: false,
        message: `Decryption failed`,
      };
    }
  }
};
