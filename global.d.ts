import type messages from "./messages/en.json";

// Types t("key") calls against the English messages, so missing keys fail `tsc`.
declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}
