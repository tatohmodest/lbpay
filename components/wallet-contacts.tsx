"use client";

import Link from "next/link";
import { contactInitials, contactSendHref, type WalletContact } from "@/lib/contacts";

export function ContactsNone() {
  return <p className="rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted">None</p>;
}

export function ContactChip({ contact }: { contact: WalletContact }) {
  return (
    <Link
      href={contactSendHref(contact)}
      className="flex min-w-16 shrink-0 flex-col items-center gap-2 rounded-2xl px-1 py-1 text-center transition hover:bg-paper"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-sm font-black text-brand">
        {contactInitials(contact.label)}
      </span>
      <span className="w-16 truncate text-xs font-bold text-ink">{contact.label}</span>
    </Link>
  );
}

export function ContactRow({ contact }: { contact: WalletContact }) {
  return (
    <Link
      href={contactSendHref(contact)}
      className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-paper"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-black text-brand">
        {contactInitials(contact.label)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink">{contact.label}</span>
        <span className="block text-xs text-muted">
          {contact.via === "wallet" ? "LBPay wallet" : contact.via === "orange" ? "Orange Money" : "MTN MoMo"}
        </span>
      </span>
      <span className="text-sm font-bold text-brand">Send</span>
    </Link>
  );
}

export function ContactsStrip({ contacts }: { contacts: WalletContact[] }) {
  if (!contacts.length) return <div className="mt-4"><ContactsNone /></div>;
  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {contacts.map((contact) => (
        <ContactChip key={contact.key} contact={contact} />
      ))}
    </div>
  );
}

export function ContactsList({ contacts }: { contacts: WalletContact[] }) {
  if (!contacts.length) return <ContactsNone />;
  return (
    <div className="space-y-0.5">
      {contacts.map((contact) => (
        <ContactRow key={contact.key} contact={contact} />
      ))}
    </div>
  );
}
