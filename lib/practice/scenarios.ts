// Story Cubes troubleshooting scenarios for A+ Core 2 (220-1202, objective 3.0 and 1.0 basics).
// Each roll shows one scenario. The learner picks the best FIRST step from three choices.
// Distractors are hand-written to be wrong or premature for that scenario.

export type Scenario = {
  id: string;
  /** Device face of the cube. */
  device: string;
  /** Symptom face of the cube. */
  symptom: string;
  /** The full situation the learner reads. */
  situation: string;
  /** The best first step. */
  best: string;
  /** Two plausible but wrong or premature first steps. */
  wrong: [string, string];
  /** Why the best step comes first. */
  why: string;
  objective: string;
};

export const scenarios: Scenario[] = [
  {
    id: "driver-bsod", device: "Laptop", symptom: "Blue screen after update",
    situation: "A laptop shows a DRIVER_IRQL_NOT_LESS_OR_EQUAL blue screen on every boot, starting the day after a graphics driver update.",
    best: "Boot into Safe Mode and roll back the recently updated driver",
    wrong: ["Reinstall Windows immediately", "Replace the RAM modules"],
    why: "The stop code and timing point to the new driver. Rolling it back is the least invasive fix, and it keeps user data in place.",
    objective: "3.1",
  },
  {
    id: "apipa", device: "Desktop", symptom: "No network after DHCP change",
    situation: "After the DHCP server was restarted, one desktop shows 169.254.22.9 and has no internet. Other PCs work.",
    best: "Run ipconfig /release, then ipconfig /renew",
    wrong: ["Set a static IP address by hand", "Run ipconfig /flushdns"],
    why: "A 169.254.x.x (APIPA) address means DHCP failed. Releasing and renewing asks the DHCP server for a new lease.",
    objective: "1.8",
  },
  {
    id: "dns-only", device: "Desktop", symptom: "Sites fail, IP works",
    situation: "A user can ping 8.8.8.8 and gets replies, but no website loads by name. Other users have the same problem.",
    best: "Use nslookup to check the DNS server and its replies",
    wrong: ["Replace the network card", "Reset the router to factory defaults"],
    why: "A working ping with failing names points to DNS. nslookup shows whether the configured DNS server answers.",
    objective: "1.8",
  },
  {
    id: "app-crash", device: "Phone", symptom: "App crashes on launch",
    situation: "After an app update, an app crashes on launch. The phone has very little free storage.",
    best: "Free up storage, then update or reinstall the app",
    wrong: ["Factory reset the phone", "Turn off Wi-Fi and retry"],
    why: "Low storage can stop an app from updating and make it crash. A factory reset is the last resort, not the first step.",
    objective: "3.2",
  },
  {
    id: "email-sync", device: "Phone", symptom: "Email stops syncing",
    situation: "Email on a phone stops syncing right after the user changed the account password.",
    best: "Update the saved password in the mail account settings",
    wrong: ["Replace the phone", "Turn on airplane mode"],
    why: "The phone still sends the old password, so the fix is to update the saved credentials.",
    objective: "3.2",
  },
  {
    id: "rotation", device: "Tablet", symptom: "Screen will not rotate",
    situation: "A tablet stays in portrait mode in every app, even when turned sideways.",
    best: "Turn off the orientation lock in quick settings",
    wrong: ["Replace the screen", "Reset the tablet to factory defaults"],
    why: "Portrait in every app usually means the orientation lock is on, not a sensor fault.",
    objective: "3.2",
  },
  {
    id: "popups", device: "Desktop", symptom: "Pop-ups and redirects",
    situation: "A PC shows pop-ups and the browser keeps redirecting to unknown sites. The user has not installed anything new.",
    best: "Verify the symptoms and identify the malware before changing anything",
    wrong: ["Reinstall the operating system right away", "Pay for a removal service"],
    why: "The malware steps start with investigation and verification. Changing things first can hide evidence or miss the real cause.",
    objective: "3.4",
  },
  {
    id: "ransom", device: "Desktop", symptom: "Files renamed, ransom note",
    situation: "Files on a shared PC have new extensions, and a ransom note is on the desktop. The attack may spread to network shares.",
    best: "Disconnect the computer from the network to stop spread",
    wrong: ["Pay the ransom to recover the files", "Run a disk defragmenter"],
    why: "Containment comes first. Disconnecting the PC keeps encryption from spreading to shares and other machines.",
    objective: "3.4",
  },
  {
    id: "fake-av", device: "Laptop", symptom: "Scary full-screen warning",
    situation: "A full-screen message says the PC is infected and asks the user to call a phone number to remove the infection.",
    best: "Close the browser or end the window in Task Manager, then run a trusted scanner",
    wrong: ["Call the number and pay the fee", "Allow remote control so the caller can help"],
    why: "This is a fake antivirus scam. Closing the window and scanning with a trusted tool removes the risk without contact with the scammer.",
    objective: "3.4",
  },
  {
    id: "storage-update", device: "Laptop", symptom: "Update fails for lack of space",
    situation: "A Windows update fails with a message about not enough storage space.",
    best: "Free up disk space, then retry the update",
    wrong: ["Install the update from a USB drive without checking space", "Disable the update service permanently"],
    why: "Updates need free space to stage files. Freeing space and retrying fixes most failures of this kind.",
    objective: "1.3",
  },
  {
    id: "overheat", device: "Laptop", symptom: "Overheats and slows down",
    situation: "A laptop runs very hot, the fan is loud, and performance drops during normal tasks.",
    best: "Clean the air vents and fans, then check that the vents are not blocked",
    wrong: ["Raise the CPU voltage in the BIOS", "Turn off the fan in the BIOS"],
    why: "Blocked airflow is the most common cause of thermal throttling. Clearing vents and fans fixes it at no cost.",
    objective: "1.5",
  },
  {
    id: "share-denied", device: "Desktop", symptom: "Access denied to a share",
    situation: "A user was added to a new security group, but still gets access denied to a shared folder.",
    best: "Sign out and back in so the new group membership takes effect",
    wrong: ["Give the user local administrator rights", "Disable the firewall"],
    why: "Group membership is read at sign-in, so the user needs a new session before the new access works.",
    objective: "2.7",
  },
  {
    id: "disk-errors", device: "Desktop", symptom: "Disk errors, files will not open",
    situation: "Event Viewer reports file-system errors on drive C:, and some files fail to open.",
    best: "Back up the data, then schedule chkdsk /f for the next restart",
    wrong: ["Format drive C: to clear the errors", "Delete the files that fail to open"],
    why: "Back up first, because a repair can fail. chkdsk /f then fixes file-system errors. Formatting destroys the data and deleting loses it.",
    objective: "1.5",
  },
  {
    id: "earbuds", device: "Phone", symptom: "Bluetooth will not reconnect",
    situation: "Bluetooth earbuds paired yesterday will not reconnect today, and the phone shows them as paired but offline.",
    best: "Forget the device, then pair it again",
    wrong: ["Replace the earbuds", "Factory reset the phone"],
    why: "A corrupted pairing record is the usual cause. Forgetting and pairing again rebuilds it.",
    objective: "1.3",
  },
];
