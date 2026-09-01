"use client";

import { ContactsList } from "@/components/wallet-contacts";
import { contactsFromTransactions } from "@/lib/contacts";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import type { Transaction } from "@/lib/types";

export default function ContactsPage() {
  const { state } = useApp();
  const me = useMe();
  const transactions = (me.data?.transactions as Transaction[] | undefined) ?? state.transactions;
  const contacts = contactsFromTransactions(transactions);

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">People</p>
      <h1 className="mt-1 text-2xl font-black">Contacts</h1>
      <p className="mt-1 text-sm text-muted">Anyone you have already paid or received from.</p>
      <div className="mt-6 rounded-[2rem] bg-white p-3 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        <ContactsList contacts={contacts} />
      </div>
    </div>
  );
}
