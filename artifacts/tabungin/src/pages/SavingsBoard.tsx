import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { encrypt, decrypt, hashKey, creatorMarkerKey } from "../lib/crypto";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  LogOut,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Banknote,
  CreditCard,
  ChevronDown,
  ChevronUp,
  UserPlus,
  X,
  Download,
  Upload,
  AlertTriangle,
  Pencil,
  Check,
  Bolt,
} from "lucide-react";
import tabunginSvg from "../assets/Tabungin.svg";

/* ─── Types ─── */
interface SavingsEntry {
  id: string;
  name: string;
  amount: number;
  note?: string;
  paymentMethod?: "cash" | "transfer";
  created_at: string;
}
interface GroupTarget {
  emoji: string;
  name: string;
  amount: number;
}
interface SavingsBoardProps {
  groupKey: string;
  isCreator: boolean;
  onLogout: () => void;
}

/* ─── Theme config ─── */
const THEMES = [
  { id: "pink", label: "🩷 Pink", color: "#F472B6" },
  { id: "purple", label: "💜 Purple", color: "#A78BFA" },
  { id: "blue", label: "🩵 Biru", color: "#60A5FA" },
  { id: "green", label: "💚 Hijau", color: "#4ADE80" },
  { id: "orange", label: "🧡 Orange", color: "#FB923C" },
];

/* CSS filter to colorize the Tabungin pig SVG per theme.
   Pig base hue ≈ 4° (salmon). Rotating to match each theme's primary hue. */
const THEME_ICON_FILTER: Record<string, string> = {
  pink: "hue-rotate(0deg) saturate(1.3) brightness(1.05)",
  purple: "hue-rotate(254deg) saturate(1.2) brightness(1.0)",
  blue: "hue-rotate(208deg) saturate(1.1) brightness(1.05)",
  green: "hue-rotate(138deg) saturate(1.2) brightness(1.0)",
  orange: "hue-rotate(20deg)  saturate(1.3) brightness(1.05)",
};

/* ─── Avatar palettes per theme ─── */
const THEME_AVATAR_PALETTES: Record<string, Array<[string, string]>> = {
  pink: [
    ["#FCE7F3", "#BE185D"],
    ["#F9A8D4", "#9D174D"],
    ["#FBCFE8", "#DB2777"],
    ["#FDE8F5", "#831843"],
    ["#FFE4F3", "#BE185D"],
    ["#F8D7EE", "#9D174D"],
    ["#FDF0FA", "#DB2777"],
    ["#F5D0E8", "#BE185D"],
  ],
  purple: [
    ["#EDE9FE", "#7C3AED"],
    ["#DDD6FE", "#5B21B6"],
    ["#C4B5FD", "#4C1D95"],
    ["#F3F0FF", "#7C3AED"],
    ["#E8E2FE", "#6D28D9"],
    ["#D5CCFF", "#5B21B6"],
    ["#EBE5FF", "#7C3AED"],
    ["#F0ECFF", "#6D28D9"],
  ],
  blue: [
    ["#DBEAFE", "#1D4ED8"],
    ["#BFDBFE", "#1E40AF"],
    ["#93C5FD", "#1E3A8A"],
    ["#EFF6FF", "#2563EB"],
    ["#E0F0FF", "#1D4ED8"],
    ["#CBE0FF", "#1E40AF"],
    ["#D6EEFF", "#2563EB"],
    ["#E8F4FF", "#1E40AF"],
  ],
  green: [
    ["#DCFCE7", "#15803D"],
    ["#BBF7D0", "#166534"],
    ["#86EFAC", "#14532D"],
    ["#F0FDF4", "#16A34A"],
    ["#D1FAE5", "#15803D"],
    ["#A7F3D0", "#065F46"],
    ["#CDFADE", "#15803D"],
    ["#E5FFF0", "#166534"],
  ],
  orange: [
    ["#FFEDD5", "#C2410C"],
    ["#FED7AA", "#9A3412"],
    ["#FDBA74", "#7C2D12"],
    ["#FFF7ED", "#EA580C"],
    ["#FFE4C4", "#C2410C"],
    ["#FDD5A0", "#9A3412"],
    ["#FFE8D0", "#C2410C"],
    ["#FFF3E8", "#EA580C"],
  ],
};

function getAvatarColors(name: string, theme: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const palette = THEME_AVATAR_PALETTES[theme] ?? THEME_AVATAR_PALETTES.pink;
  return palette[Math.abs(h) % palette.length];
}

/* ─── Emoji options ─── */
const EMOJI_OPTIONS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "🥲",
  "☺️",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😝",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🥸",
  "🤩",
  "🥳",
  "😏",
  "😒",
  "😞",
  "😔",
  "😟",
  "😕",
  "🙁",
  "☹️",
  "😣",
  "😖",
  "😫",
  "😩",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "🤯",
  "😳",
  "🥵",
  "🥶",
  "😱",
  "😨",
  "😰",
  "😥",
  "😓",
  "🤗",
  "🤔",
  "🤭",
  "🤫",
  "🤥",
  "😶",
  "😐",
  "😑",
  "😬",
  "🙄",
  "😯",
  "😦",
  "😧",
  "😮",
  "😲",
  "🥱",
  "😴",
  "🤤",
  "😪",
  "😵",
  "🤐",
  "🥴",
  "🤢",
  "🤮",
  "🤧",
  "😷",
  "🤒",
  "🤕",
  "🤑",
  "🤠",
  "😈",
  "👿",
  "👹",
  "👺",
  "🤡",
  "👻",
  "💀",
  "☠️",
  "👽",
  "👾",
  "🤖",
  "🎃",
  "😺",
  "😸",
  "😻",
  "😼",
  "😽",
  "🙀",
  "😿",
  "😾",
  "👶🏻",
  "👧🏻",
  "🧒🏻",
  "👦🏻",
  "👩🏻",
  "🧑🏻",
  "👨🏻",
  "👵🏻",
  "🧓🏻",
  "👴🏻",
  "👲🏻",
  "🧕🏻",
  "🤴🏻",
  "👸🏻",
  "🎅🏻",
  "🤶🏻",
  "🦸🏻",
  "🦹🏻",
  "🧙🏻",
  "🧚🏻",
  "🧛🏻",
  "🧜🏻",
  "🧝🏻",
  "🥷🏻",
  "💂🏻",
  "🕵🏻",
  "👮🏻",
  "👷🏻",
  "🤵🏻",
  "👰🏻",
  "🤰🏻",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "💔",
  "❤️‍🔥",
  "❤️‍🩹",
  "❣️",
  "💕",
  "💞",
  "💓",
  "💗",
  "💖",
  "💘",
  "💝",
  "💟",
  "🫶",
  "🏔️",
  "⛰️",
  "🌋",
  "🗻",
  "🏕️",
  "🏖️",
  "🏜️",
  "🏝️",
  "🏞️",
  "🏟️",
  "🏛️",
  "🏗️",
  "🏘️",
  "🏚️",
  "🏠",
  "🏡",
  "🏢",
  "🏣",
  "🏤",
  "🏥",
  "🏦",
  "🏨",
  "🏩",
  "🏪",
  "🏫",
  "🏬",
  "🏭",
  "🏯",
  "🏰",
  "💒",
  "🗼",
  "🗽",
  "⛪",
  "🕌",
  "🛕",
  "🕍",
  "⛩️",
  "🕋",
  "⛲",
  "⛺",
  "🌁",
  "🌃",
  "🏙️",
  "🌄",
  "🌅",
  "🌆",
  "🌇",
  "🌉",
  "🎠",
  "🎡",
  "🎢",
  "🚂",
  "🚃",
  "🚄",
  "🚅",
  "🚆",
  "🚇",
  "🚈",
  "🚉",
  "🚊",
  "🚝",
  "🚞",
  "🚋",
  "🚌",
  "🚍",
  "🚎",
  "🚐",
  "🚑",
  "🚒",
  "🚓",
  "🚔",
  "🚕",
  "🚖",
  "🚗",
  "🚘",
  "🚙",
  "🛻",
  "🚚",
  "🚛",
  "🚜",
  "🏎️",
  "🏍️",
  "🛵",
  "🚲",
  "🛴",
  "🚏",
  "🛤️",
  "⛽",
  "🚨",
  "🚥",
  "🚦",
  "🛑",
  "🚧",
  "⚓",
  "⛵",
  "🛶",
  "🚤",
  "🛳️",
  "⛴️",
  "🛥️",
  "🚢",
  "✈️",
  "🛫",
  "🛬",
  "🪂",
  "💺",
  "🚁",
  "🚟",
  "🚠",
  "🚡",
  "🛰️",
  "🚀",
  "🛸",
  "🍅",
  "🍆",
  "🥑",
  "🥦",
  "🥬",
  "🥒",
  "🌶️",
  "🌽",
  "🥕",
  "🫒",
  "🧄",
  "🧅",
  "🥔",
  "🍠",
  "🥐",
  "🥯",
  "🍞",
  "🥖",
  "🥨",
  "🧀",
  "🥚",
  "🍳",
  "🧈",
  "🥞",
  "🧇",
  "🥓",
  "🥩",
  "🍗",
  "🍖",
  "🦴",
  "🌭",
  "🍔",
  "🍟",
  "🍕",
  "🥪",
  "🥙",
  "🧆",
  "🌮",
  "🌯",
  "🥗",
  "🥘",
  "🫕",
  "🥣",
  "🍝",
  "🍜",
  "🍲",
  "🍛",
  "🍣",
  "🍱",
  "🥟",
  "🦪",
  "🍤",
  "🍙",
  "🍚",
  "🍘",
  "🍥",
  "🥠",
  "🍢",
  "🍡",
  "🍧",
  "🍨",
  "🍦",
  "🥧",
  "🧁",
  "🍰",
  "🎂",
  "🍮",
  "🍭",
  "🍬",
  "🍫",
  "🍿",
  "🍩",
  "🍪",
  "🌰",
  "🥜",
  "🍯",
  "🥛",
  "☕",
  "🫖",
  "🍵",
  "🧃",
  "🥤",
  "🧋",
  "🍶",
  "🍺",
  "🍻",
  "🥂",
  "🍷",
  "🥃",
  "🍸",
  "🍹",
  "🧉",
  "🍾",
  "🧊",
  "🍏",
  "🍎",
  "🍐",
  "🍊",
  "🍋",
  "🍌",
  "🍉",
  "🍇",
  "🍓",
  "🫐",
  "🍈",
  "🍒",
  "🍑",
  "🥭",
  "🍍",
  "🥥",
  "🥝",
];

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

/* ─── EmojiGrid — click-only picker ─── */
const EmojiGrid = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (e: string) => void;
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(10,1fr)",
      gap: 3,
      background: "var(--bg)",
      border: "1.5px solid var(--border)",
      borderRadius: "var(--radius-md)",
      padding: "0.5rem",
      maxHeight: 220,
      overflowY: "auto",
    }}
  >
    {EMOJI_OPTIONS.map((em) => (
      <button
        key={em}
        type="button"
        onClick={() => onSelect(em)}
        style={{
          fontSize: "1.2rem",
          lineHeight: 1,
          padding: "0.18rem",
          borderRadius: 7,
          border:
            selected === em
              ? "2px solid var(--primary)"
              : "2px solid transparent",
          background: selected === em ? "var(--primary-light)" : "transparent",
          cursor: "pointer",
          transition: "all 0.1s",
        }}
      >
        {em}
      </button>
    ))}
  </div>
);

const PaymentToggle = ({
  value,
  onChange,
}: {
  value: "cash" | "transfer";
  onChange: (v: "cash" | "transfer") => void;
}) => (
  <div style={{ display: "flex", gap: "0.625rem" }}>
    {(["cash", "transfer"] as const).map((m) => (
      <button
        key={m}
        type="button"
        onClick={() => onChange(m)}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          padding: "0.55rem",
          borderRadius: "var(--radius-md)",
          border: `2px solid ${value === m ? "var(--primary)" : "var(--border)"}`,
          background: value === m ? "var(--primary-light)" : "var(--bg)",
          color: value === m ? "var(--primary-hover)" : "var(--text-muted)",
          fontWeight: 700,
          fontSize: "0.82rem",
          cursor: "pointer",
          transition: "all 0.15s",
          fontFamily: "var(--font-sans)",
        }}
      >
        {m === "cash" ? (
          <>
            <Banknote size={14} />
            💵 Cash
          </>
        ) : (
          <>
            <CreditCard size={14} />
            💳 Transfer
          </>
        )}
      </button>
    ))}
  </div>
);

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export const SavingsBoard: React.FC<SavingsBoardProps> = ({
  groupKey,
  isCreator,
  onLogout,
}) => {
  const groupId = hashKey(groupKey);
  const creatorKey = creatorMarkerKey(groupKey);
  const emojiKey = `tabungin_emojis_${groupId}`;
  const targetKey = `tabungin_target_${groupId}`;
  const themeKey = "tabungin_theme";

  /* ── state ── */
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const [memberEmojis, setMemberEmojis] = useState<Record<string, string>>(
    () => {
      try {
        return JSON.parse(localStorage.getItem(emojiKey) || "{}");
      } catch {
        return {};
      }
    },
  );

  const [groupTarget, setGroupTarget] = useState<GroupTarget | null>(() => {
    try {
      const r = localStorage.getItem(targetKey);
      return r ? JSON.parse(r) : null;
    } catch {
      return null;
    }
  });
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetEmoji, setTargetEmoji] = useState(groupTarget?.emoji || "🎯");
  const [targetName, setTargetName] = useState(groupTarget?.name || "");
  const [targetAmt, setTargetAmt] = useState(
    groupTarget?.amount?.toString() || "",
  );
  const [showTargetEmojiPicker, setShowTargetEmojiPicker] = useState(false);

  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [addFormName, setAddFormName] = useState<string | null>(null);
  const [emojiEditName, setEmojiEditName] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editPayment, setEditPayment] = useState<"cash" | "transfer">("cash");

  const [addAmount, setAddAmount] = useState("");
  const [addNote, setAddNote] = useState("");
  const [addPayment, setAddPayment] = useState<"cash" | "transfer">("cash");

  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonEmoji, setNewPersonEmoji] = useState("🐷");
  const [showNewEmojiPicker, setShowNewEmojiPicker] = useState(false);
  const [showNewPersonForm, setShowNewPersonForm] = useState(false);

  /* ── settings ── */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(
    () => localStorage.getItem(themeKey) || "pink",
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  /* ── fetch ── */
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!supabase)
        throw new Error(
          "Supabase tidak terkonfigurasi. Harap tambahkan environment variables VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY",
        );
      const { data, error: fe } = await supabase
        .from("savings_data")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });
      if (fe) throw fe;
      const dec: SavingsEntry[] = [];
      for (const row of data ?? []) {
        const r = decrypt<{
          name: string;
          amount: number;
          note?: string;
          paymentMethod?: "cash" | "transfer";
        }>(row.encrypted_content, groupKey);
        if (r) dec.push({ id: row.id, created_at: row.created_at, ...r });
      }
      setEntries(dec);
    } catch (err: any) {
      setError(`Gagal konek: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [groupKey, groupId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  /* ── computed ── */
  const groupedByName = (() => {
    const map = new Map<string, SavingsEntry[]>();
    for (const e of entries) {
      if (!map.has(e.name)) map.set(e.name, []);
      map.get(e.name)!.push(e);
    }
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      items: [...items].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
      total: items.reduce((s, i) => s + i.amount, 0),
    }));
  })();

  const total = entries.reduce((s, e) => s + e.amount, 0);
  const progress =
    groupTarget && groupTarget.amount > 0
      ? Math.min((total / groupTarget.amount) * 100, 100)
      : 0;

  /* ── helpers ── */
  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  };

  const requireCreator = () => {
    const allowed = isCreator || localStorage.getItem(creatorKey) === "creator";
    if (!allowed) {
      setError("Hanya pembuat kode pertama yang bisa mengubah data ini.");
    }
    return allowed;
  };

  const saveEmoji = (name: string, emoji: string) => {
    const u = { ...memberEmojis, [name]: emoji };
    setMemberEmojis(u);
    localStorage.setItem(emojiKey, JSON.stringify(u));
  };

  const applyTheme = (id: string) => {
    setActiveTheme(id);
    localStorage.setItem(themeKey, id);
    if (id === "pink") document.body.removeAttribute("data-theme");
    else document.body.setAttribute("data-theme", id);
  };

  const saveTarget = () => {
    const amt = Number(targetAmt);
    if (!targetName.trim() || !amt || amt <= 0) return;
    const t: GroupTarget = {
      emoji: targetEmoji,
      name: targetName.trim(),
      amount: amt,
    };
    setGroupTarget(t);
    localStorage.setItem(targetKey, JSON.stringify(t));
    setEditingTarget(false);
    setShowTargetEmojiPicker(false);
  };

  const openEditTarget = () => {
    setTargetEmoji(groupTarget?.emoji || "🎯");
    setTargetName(groupTarget?.name || "");
    setTargetAmt(groupTarget?.amount?.toString() || "");
    setEditingTarget(true);
    setShowTargetEmojiPicker(false);
  };

  /* ── CRUD ── */
  const handleAddEntry = async (forName: string) => {
    if (!requireCreator()) return;
    const amt = Number(addAmount);
    if (!amt || amt <= 0) return;
    setSubmitting(true);
    setError("");
    try {
      if (!supabase) throw new Error("Supabase tidak terkonfigurasi");
      const enc = encrypt(
        {
          name: forName,
          amount: amt,
          note: addNote.trim() || undefined,
          paymentMethod: addPayment,
        },
        groupKey,
      );
      const { error: ie } = await supabase
        .from("savings_data")
        .insert({ group_id: groupId, encrypted_content: enc });
      if (ie) throw ie;
      setAddAmount("");
      setAddNote("");
      setAddPayment("cash");
      setAddFormName(null);
      flash(`Setoran ${forName} disimpen! 🎉`);
      await fetchEntries();
    } catch (err: any) {
      setError(`Gagal: ${err?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNewPerson = async () => {
    if (!requireCreator()) return;
    const name = newPersonName.trim();
    const amt = Number(addAmount);
    if (!name || !amt || amt <= 0) return;
    setSubmitting(true);
    setError("");
    try {
      if (!supabase) throw new Error("Supabase tidak terkonfigurasi");
      const enc = encrypt(
        {
          name,
          amount: amt,
          note: addNote.trim() || undefined,
          paymentMethod: addPayment,
        },
        groupKey,
      );
      const { error: ie } = await supabase
        .from("savings_data")
        .insert({ group_id: groupId, encrypted_content: enc });
      if (ie) throw ie;
      saveEmoji(name, newPersonEmoji);
      setNewPersonName("");
      setNewPersonEmoji("🐷");
      setAddAmount("");
      setAddNote("");
      setAddPayment("cash");
      setShowNewPersonForm(false);
      setExpandedName(name);
      flash(`${name} berhasil masuk grup! 🎉`);
      await fetchEntries();
    } catch (err: any) {
      setError(`Gagal: ${err?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!requireCreator()) return;
    if (!editingId) return;
    const amt = Number(editAmount);
    if (!amt || amt <= 0) return;
    const entry = entries.find((e) => e.id === editingId);
    if (!entry) return;
    setSubmitting(true);
    setError("");
    try {
      if (!supabase) throw new Error("Supabase tidak terkonfigurasi");
      const enc = encrypt(
        {
          name: entry.name,
          amount: amt,
          note: editNote.trim() || undefined,
          paymentMethod: editPayment,
        },
        groupKey,
      );
      const { error: ue } = await supabase
        .from("savings_data")
        .update({ encrypted_content: enc })
        .eq("id", editingId);
      if (ue) throw ue;
      setEditingId(null);
      flash("Catatan diperbarui! ✏️");
      await fetchEntries();
    } catch (err: any) {
      setError(`Gagal: ${err?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!requireCreator()) return;
    if (!confirm("Yakin mau hapus catatan ini? Gak bisa di-undo lho 😅"))
      return;
    setSubmitting(true);
    try {
      if (!supabase) throw new Error("Supabase tidak terkonfigurasi");
      const { error: de } = await supabase
        .from("savings_data")
        .delete()
        .eq("id", id);
      if (de) throw de;
      flash("Catatan dihapus 🗑️");
      await fetchEntries();
    } catch (err: any) {
      setError(`Gagal: ${err?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const data = entries.map((e) => ({
      name: e.name,
      amount: e.amount,
      note: e.note,
      paymentMethod: e.paymentMethod,
      created_at: e.created_at,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tabungin-${groupId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Data diekspor! 📥");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!requireCreator()) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (!supabase) throw new Error("Supabase tidak terkonfigurasi");
      const data = JSON.parse(await file.text()) as Array<{
        name: string;
        amount: number;
        note?: string;
        paymentMethod?: string;
      }>;
      if (!Array.isArray(data)) throw new Error("Format tidak valid");
      setSubmitting(true);
      for (const row of data) {
        if (!row.name || !row.amount) continue;
        const enc = encrypt(
          {
            name: row.name,
            amount: Number(row.amount),
            note: row.note,
            paymentMethod: (row.paymentMethod as "cash" | "transfer") || "cash",
          },
          groupKey,
        );
        await supabase
          .from("savings_data")
          .insert({ group_id: groupId, encrypted_content: enc });
      }
      flash(`${data.length} catatan diimpor! 🎉`);
      await fetchEntries();
    } catch (err: any) {
      setError(`Gagal import: ${err?.message}`);
    } finally {
      setSubmitting(false);
      if (importRef.current) importRef.current.value = "";
    }
  };

  const handleReset = async () => {
    if (!requireCreator()) return;
    setSubmitting(true);
    try {
      if (!supabase) throw new Error("Supabase tidak terkonfigurasi");
      const { error: de } = await supabase
        .from("savings_data")
        .delete()
        .eq("group_id", groupId);
      if (de) throw de;
      setEntries([]);
      setShowResetConfirm(false);
      setSettingsOpen(false);
      flash("Semua data grup dihapus 🗑️");
    } catch (err: any) {
      setError(`Gagal reset: ${err?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const paymentBadge = (method?: "cash" | "transfer"): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "0.18rem 0.5rem",
    borderRadius: "999px",
    background: method === "transfer" ? "#EDE9FE" : "#FEF9C3",
    color: method === "transfer" ? "#7C3AED" : "#92400E",
    border: `1px solid ${method === "transfer" ? "#DDD6FE" : "#FDE68A"}`,
    width: "fit-content",
  });

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "1.5rem 1.25rem 3rem",
      }}
      className="animate-fade-in"
    >
      {/* ─── Header ─── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.125rem",
        }}
      >
        {/* Logo — Tabungin.svg colorized per theme */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img
            src={tabunginSvg}
            alt="Celengan"
            width={28}
            height={28}
            className="tabungin-logo"
            style={{ filter: THEME_ICON_FILTER[activeTheme] }}
          />
          <h2 style={{ margin: 0 }}>Tabungin</h2>
        </div>

        {/* Icon-only action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Settings gear */}
          <button
            onClick={() => {
              setSettingsOpen((o) => !o);
              setShowResetConfirm(false);
            }}
            className={`btn-icon${settingsOpen ? " active" : ""}`}
            title="Setelan"
          >
            <Bolt
              size={17}
              color={
                settingsOpen ? "var(--primary-hover)" : "var(--text-muted)"
              }
            />
          </button>

          {/* Logout */}
          <button onClick={onLogout} className="btn-icon" title="Keluar">
            <LogOut size={17} color="var(--text-muted)" />
          </button>
        </div>
      </header>

      {/* ─── Settings panel ─── */}
      {settingsOpen && (
        <div
          className="card settings-panel mb-4"
          style={{ padding: "1rem 1.125rem" }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.8rem",
              marginBottom: 8,
              color: "var(--text-main)",
            }}
          >
            🎨 Tema Warna
          </p>
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: "0.875rem",
            }}
          >
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "0.35rem 0.65rem",
                  borderRadius: "var(--radius-full)",
                  border: `2px solid ${activeTheme === t.id ? t.color : "var(--border)"}`,
                  background:
                    activeTheme === t.id ? `${t.color}22` : "var(--bg)",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  color: activeTheme === t.id ? t.color : "var(--text-muted)",
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: t.color,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {t.label}
                {activeTheme === t.id && <Check size={11} />}
              </button>
            ))}
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <button
              onClick={handleExport}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "var(--bg)",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "0.55rem 0.875rem",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: "0.85rem",
                color: "var(--text-main)",
                transition: "all 0.15s",
              }}
            >
              <Download size={14} color="var(--primary-hover)" /> Export Data
              (JSON)
            </button>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "var(--bg)",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "0.55rem 0.875rem",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: "0.85rem",
                color: "var(--text-main)",
                transition: "all 0.15s",
              }}
            >
              <Upload size={14} color="var(--primary-hover)" /> Import Data
              (JSON)
              <input
                ref={importRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: "none" }}
              />
            </label>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "#FFF5F5",
                  border: "1.5px solid #FECACA",
                  borderRadius: "var(--radius-md)",
                  padding: "0.55rem 0.875rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "#DC2626",
                  transition: "all 0.15s",
                }}
              >
                <AlertTriangle size={14} /> Reset Semua Data Grup
              </button>
            ) : (
              <div
                style={{
                  background: "#FFF5F5",
                  border: "1.5px solid #FECACA",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem",
                }}
              >
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    color: "#DC2626",
                    marginBottom: 8,
                  }}
                >
                  ⚠️ Semua catatan grup akan dihapus permanen!
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="btn btn-secondary w-full"
                    style={{ fontSize: "0.78rem", padding: "0.45rem" }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      background: "#DC2626",
                      color: "white",
                      border: "none",
                      borderRadius: "var(--radius-full)",
                      padding: "0.45rem",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {submitting ? "Menghapus..." : "Ya, Hapus Semua"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Target / Summary card ─── */}
      {!editingTarget ? (
        <section
          className="card mb-4"
          style={{
            background: "var(--primary-gradient)",
            borderColor: "var(--primary-hover)",
            color: "white",
            padding: "1.25rem 1.375rem",
            position: "relative",
          }}
        >
          {requireCreator() && (
            <button
              onClick={openEditTarget}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
              }}
              title="Edit target"
            >
              <Pencil size={17} />
            </button>
          )}

          {groupTarget ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <div style={{ fontSize: "2.25rem", marginBottom: 3 }}>
                  {groupTarget.emoji}
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    opacity: 0.85,
                    fontWeight: 600,
                  }}
                >
                  {groupTarget.name}
                </div>
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  textAlign: "center",
                  marginBottom: 10,
                }}
              >
                {formatIDR(total)}
              </div>
              <div
                style={{
                  height: 9,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.28)",
                  overflow: "hidden",
                  marginBottom: 5,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    borderRadius: 999,
                    background:
                      progress >= 100
                        ? "linear-gradient(90deg,#4ADE80,#16A34A)"
                        : "rgba(255,255,255,0.85)",
                    transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.72rem",
                  opacity: 0.82,
                  marginBottom: 3,
                }}
              >
                <span>{Math.round(progress)}% tercapai</span>
                <span>Target: {formatIDR(groupTarget.amount)}</span>
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.78rem",
                  opacity: 0.82,
                  marginTop: 4,
                }}
              >
                {progress >= 100
                  ? "Selamat, target tercapai!"
                  : `Kurang ${formatIDR(groupTarget.amount - total)} lagi 💪`}
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.72rem",
                  opacity: 0.65,
                  marginTop: 6,
                }}
              >
                {groupedByName.length} anggota · {entries.length} catatan
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  textAlign: "center",
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: 5,
                }}
              >
                {formatIDR(total)}
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.82rem",
                  opacity: 0.82,
                  marginBottom: 8,
                }}
              >
                {groupedByName.length} anggota · {entries.length} catatan
              </div>
              <button
                onClick={openEditTarget}
                style={{
                  display: "block",
                  width: "100%",
                  background: "rgba(255,255,255,0.18)",
                  border: "1.5px dashed rgba(255,255,255,0.55)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.475rem",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                🎯 Set Target Tabungan
              </button>
            </>
          )}
        </section>
      ) : (
        <div
          className="card mb-4 animate-fade-in"
          style={{ border: "2px solid var(--primary)" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.875rem",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "0.975rem" }}>
              🎯 Target Tabungan
            </h3>
            <button
              onClick={() => {
                setEditingTarget(false);
                setShowTargetEmojiPicker(false);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
              }}
            >
              <X size={17} />
            </button>
          </div>
          <div className="input-group">
            <label>Emoji Target</label>
            <button
              type="button"
              onClick={() => setShowTargetEmojiPicker((p) => !p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--primary-light)",
                border: "1.5px solid var(--primary)",
                borderRadius: "var(--radius-md)",
                padding: "0.55rem 0.875rem",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "var(--primary-hover)",
                width: "fit-content",
              }}
            >
              <span style={{ fontSize: "1.4rem" }}>{targetEmoji}</span>
              {showTargetEmojiPicker ? "Tutup" : "Pilih emoji"}
            </button>
            {showTargetEmojiPicker && (
              <div style={{ marginTop: 5 }}>
                <EmojiGrid
                  selected={targetEmoji}
                  onSelect={(em) => {
                    setTargetEmoji(em);
                    setShowTargetEmojiPicker(false);
                  }}
                />
              </div>
            )}
          </div>
          <div className="input-group">
            <label>Nama Target</label>
            <input
              type="text"
              className="input"
              placeholder="mis. Liburan Bali, Dana Darurat..."
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="input-group">
            <label>Nominal Target (Rp)</label>
            <input
              type="number"
              className="input"
              placeholder="mis. 5000000"
              value={targetAmt}
              onChange={(e) => setTargetAmt(e.target.value)}
              min="1"
            />
          </div>
          <div
            style={{ display: "flex", gap: "0.75rem", marginTop: "0.625rem" }}
          >
            {groupTarget && (
              <button
                type="button"
                onClick={() => {
                  setGroupTarget(null);
                  localStorage.removeItem(targetKey);
                  setEditingTarget(false);
                  setShowTargetEmojiPicker(false);
                }}
                className="btn btn-secondary"
                style={{
                  fontSize: "0.82rem",
                  color: "#DC2626",
                  borderColor: "#FECACA",
                }}
              >
                Hapus
              </button>
            )}
            <button
              type="button"
              onClick={saveTarget}
              className="btn btn-primary w-full"
              style={{ fontSize: "0.85rem" }}
            >
              Simpan Target 🎯
            </button>
          </div>
        </div>
      )}

      {/* ─── Feedback ─── */}
      {success && (
        <div
          className="animate-pop-in"
          style={{
            background: "linear-gradient(135deg,#86EFAC,#4ADE80)",
            color: "#14532D",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem 1rem",
            marginBottom: "0.875rem",
            textAlign: "center",
            fontWeight: 700,
            fontSize: "0.95rem",
          }}
        >
          {success}
        </div>
      )}
      {error && (
        <div
          style={{
            background: "#FFF5F5",
            border: "1px solid #FECACA",
            color: "#DC2626",
            borderRadius: "var(--radius-md)",
            padding: "0.625rem 0.875rem",
            marginBottom: "0.875rem",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      {/* ─── Member list ─── */}
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.875rem",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1rem" }}>Anggota Grup:</h3>
          <button
            onClick={fetchEntries}
            className="btn btn-secondary"
            style={{
              padding: "0.35rem 0.65rem",
              fontSize: "0.78rem",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            disabled={loading}
          >
            <RefreshCw
              size={12}
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--text-muted)",
            }}
          >
            Lagi loading... ⏳
          </div>
        ) : groupedByName.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: "center", padding: "2rem 1rem" }}
          >
            <div style={{ fontSize: "2.25rem", marginBottom: "0.625rem" }}>
              🐷
            </div>
            <p
              style={{
                fontWeight: 600,
                color: "var(--text-muted)",
                fontSize: "0.9rem",
              }}
            >
              Belum ada anggota nih.
              <br />
              Klik tombol di bawah buat mulai! 💪
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
            }}
          >
            {groupedByName.map(({ name, items, total: pTotal }, idx) => {
              /* Avatar colors follow active theme */
              const [bg, fg] = getAvatarColors(name, activeTheme);
              const emoji = memberEmojis[name];
              const isExpanded = expandedName === name;
              const isAddingHere = addFormName === name;
              const isEditingEmoji = emojiEditName === name;

              return (
                <div
                  key={name}
                  className="card animate-slide-up"
                  style={{
                    animationDelay: `${idx * 35}ms`,
                    padding: 0,
                    overflow: "hidden",
                  }}
                >
                  {/* Header row */}
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedName(isExpanded ? null : name);
                      if (isExpanded) {
                        setAddFormName(null);
                        setEditingId(null);
                        setEmojiEditName(null);
                      }
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.875rem 1.125rem",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {/* Avatar — tap when expanded to open emoji picker */}
                    <div
                      onClick={(e) => {
                        if (!isExpanded) return;
                        e.stopPropagation();
                        setEmojiEditName(isEditingEmoji ? null : name);
                      }}
                      title={isExpanded ? "Klik untuk ganti emoji" : ""}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: emoji ? "1.45rem" : "0.95rem",
                        color: fg,
                        flexShrink: 0,
                        border: `2px solid ${fg}44`,
                        userSelect: "none",
                        cursor: isExpanded ? "pointer" : "default",
                        boxShadow: isEditingEmoji
                          ? `0 0 0 3px var(--primary)`
                          : "none",
                        transition:
                          "box-shadow 0.2s, background 0.35s, color 0.35s",
                      }}
                    >
                      {emoji || name.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.975rem",
                          color: "var(--text-main)",
                        }}
                      >
                        {name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.76rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {items.length} setoran
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 800,
                        color: "var(--primary-hover)",
                        fontSize: "0.88rem",
                        background: "var(--primary-light)",
                        padding: "0.2rem 0.575rem",
                        borderRadius: "var(--radius-full)",
                        marginRight: 6,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatIDR(pTotal)}
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} color="var(--text-muted)" />
                    ) : (
                      <ChevronDown size={16} color="var(--text-muted)" />
                    )}
                  </button>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div
                      style={{
                        borderTop: "1px solid var(--border)",
                        padding: "0.625rem 1.125rem 0.875rem",
                      }}
                    >
                      {/* Inline emoji picker (tap avatar to open) */}
                      {isEditingEmoji && (
                        <div style={{ marginBottom: "0.625rem" }}>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              marginBottom: 5,
                              fontWeight: 600,
                            }}
                          >
                            Pilih atau ketik emoji untuk {name}:
                          </p>
                          <EmojiGrid
                            selected={emoji || "🐷"}
                            onSelect={(em) => {
                              saveEmoji(name, em);
                              setEmojiEditName(null);
                            }}
                          />
                        </div>
                      )}

                      {/* Entry list */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                          marginBottom: "0.75rem",
                        }}
                      >
                        {items.map((entry) => (
                          <div key={entry.id}>
                            {editingId === entry.id ? (
                              <div
                                style={{
                                  background: "var(--bg)",
                                  border: "1.5px solid var(--primary)",
                                  borderRadius: "var(--radius-md)",
                                  padding: "0.75rem",
                                }}
                              >
                                <div className="input-group">
                                  <label style={{ fontSize: "0.78rem" }}>
                                    Jumlah (Rp)
                                  </label>
                                  <input
                                    type="number"
                                    className="input"
                                    value={editAmount}
                                    onChange={(e) =>
                                      setEditAmount(e.target.value)
                                    }
                                    min="1"
                                    autoFocus
                                  />
                                </div>
                                <div className="input-group">
                                  <label style={{ fontSize: "0.78rem" }}>
                                    Metode Bayar
                                  </label>
                                  <PaymentToggle
                                    value={editPayment}
                                    onChange={setEditPayment}
                                  />
                                </div>
                                <div className="input-group">
                                  <label style={{ fontSize: "0.78rem" }}>
                                    Catatan (Opsional)
                                  </label>
                                  <input
                                    type="text"
                                    className="input"
                                    value={editNote}
                                    onChange={(e) =>
                                      setEditNote(e.target.value)
                                    }
                                    placeholder="mis. Iuran minggu ke-3..."
                                  />
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    marginTop: 4,
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    className="btn btn-secondary w-full"
                                    style={{
                                      fontSize: "0.82rem",
                                      padding: "0.55rem",
                                    }}
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSaveEdit}
                                    className="btn btn-primary w-full"
                                    disabled={submitting}
                                    style={{
                                      fontSize: "0.82rem",
                                      padding: "0.55rem",
                                    }}
                                  >
                                    {submitting ? "Nyimpen..." : "Update ✏️"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "0.625rem",
                                  background: "var(--bg-card)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "var(--radius-md)",
                                  padding: "0.55rem 0.75rem",
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={paymentBadge(entry.paymentMethod)}
                                  >
                                    {entry.paymentMethod === "transfer" ? (
                                      <>
                                        <CreditCard size={9} /> Transfer
                                      </>
                                    ) : (
                                      <>
                                        <Banknote size={9} /> Cash
                                      </>
                                    )}
                                  </div>
                                  {entry.note && (
                                    <div
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "var(--text-muted)",
                                        marginTop: 2,
                                      }}
                                    >
                                      💬 {entry.note}
                                    </div>
                                  )}
                                  <div
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "var(--text-muted)",
                                      marginTop: 1,
                                    }}
                                  >
                                    🕐 {formatDate(entry.created_at)}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      color: "var(--primary-hover)",
                                      fontSize: "0.88rem",
                                    }}
                                  >
                                    {formatIDR(entry.amount)}
                                  </div>
                                  {requireCreator() && (
                                    <button
                                      onClick={() => {
                                        setEditingId(entry.id);
                                        setEditAmount(entry.amount.toString());
                                        setEditNote(entry.note || "");
                                        setEditPayment(
                                          entry.paymentMethod || "cash",
                                        );
                                      }}
                                      className="btn btn-secondary"
                                      style={{
                                        padding: "0.28rem 0.45rem",
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                      disabled={submitting}
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                  )}
                                  {requireCreator() && (
                                    <button
                                      onClick={() => handleDelete(entry.id)}
                                      className="btn btn-secondary"
                                      style={{
                                        padding: "0.28rem 0.45rem",
                                        display: "flex",
                                        alignItems: "center",
                                        color: "#DC2626",
                                        borderColor: "#FECACA",
                                      }}
                                      disabled={submitting}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add setoran */}
                      {isAddingHere ? (
                        <div
                          style={{
                            background: "var(--bg)",
                            border: "1.5px solid var(--primary)",
                            borderRadius: "var(--radius-md)",
                            padding: "0.75rem",
                          }}
                        >
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              marginBottom: "0.625rem",
                              color: "var(--primary-hover)",
                            }}
                          >
                            + Setoran baru untuk {name}
                          </p>
                          <div className="input-group">
                            <label style={{ fontSize: "0.78rem" }}>
                              Jumlah (Rp)
                            </label>
                            <input
                              type="number"
                              className="input"
                              placeholder="mis. 50000"
                              value={addAmount}
                              onChange={(e) => setAddAmount(e.target.value)}
                              min="1"
                              autoFocus
                            />
                          </div>
                          <div className="input-group">
                            <label style={{ fontSize: "0.78rem" }}>
                              Metode Bayar
                            </label>
                            <PaymentToggle
                              value={addPayment}
                              onChange={setAddPayment}
                            />
                          </div>
                          <div className="input-group">
                            <label style={{ fontSize: "0.78rem" }}>
                              Catatan (Opsional)
                            </label>
                            <input
                              type="text"
                              className="input"
                              placeholder="mis. Iuran minggu ke-3..."
                              value={addNote}
                              onChange={(e) => setAddNote(e.target.value)}
                            />
                          </div>
                          <div
                            style={{ display: "flex", gap: 8, marginTop: 4 }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setAddFormName(null);
                                setAddAmount("");
                                setAddNote("");
                                setAddPayment("cash");
                              }}
                              className="btn btn-secondary w-full"
                              style={{
                                fontSize: "0.82rem",
                                padding: "0.55rem",
                              }}
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddEntry(name)}
                              className="btn btn-primary w-full"
                              disabled={submitting}
                              style={{
                                fontSize: "0.82rem",
                                padding: "0.55rem",
                              }}
                            >
                              {submitting ? "Nyimpen..." : "Simpan 💾"}
                            </button>
                          </div>
                        </div>
                      ) : requireCreator() ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAddFormName(name);
                            setEditingId(null);
                            setEmojiEditName(null);
                            setAddAmount("");
                            setAddNote("");
                            setAddPayment("cash");
                          }}
                          className="btn btn-primary w-full"
                          style={{
                            fontSize: "0.82rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            padding: "0.65rem",
                          }}
                        >
                          <Plus size={14} /> Tambah Setoran
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add new person */}
        <div style={{ marginTop: "0.75rem" }}>
          {requireCreator() &&
            (showNewPersonForm ? (
              <div
                className="card animate-fade-in"
                style={{ border: "2px solid var(--primary)" }}
              >
                <h3 style={{ marginBottom: "0.875rem", fontSize: "0.975rem" }}>
                  Anggota Baru 🙋
                </h3>

                <div className="input-group">
                  <label>Emoji Profil</label>
                  <button
                    type="button"
                    onClick={() => setShowNewEmojiPicker((p) => !p)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      background: "var(--primary-light)",
                      border: "1.5px solid var(--primary)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.55rem 0.875rem",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "var(--primary-hover)",
                      width: "fit-content",
                    }}
                  >
                    <span style={{ fontSize: "1.35rem" }}>
                      {newPersonEmoji}
                    </span>
                    {showNewEmojiPicker ? "Tutup" : "Pilih emoji"}
                  </button>
                  {showNewEmojiPicker && (
                    <div style={{ marginTop: 5 }}>
                      <EmojiGrid
                        selected={newPersonEmoji}
                        onSelect={(em) => {
                          setNewPersonEmoji(em);
                          setShowNewEmojiPicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor="newName">Nama siapa?</label>
                  <input
                    id="newName"
                    type="text"
                    className="input"
                    placeholder="mis. Budi, Sari, dll..."
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="newAmount">Setoran pertama (Rp)</label>
                  <input
                    id="newAmount"
                    type="number"
                    className="input"
                    placeholder="mis. 100000"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="input-group">
                  <label>Metode Bayar</label>
                  <PaymentToggle value={addPayment} onChange={setAddPayment} />
                </div>
                <div className="input-group">
                  <label htmlFor="newNote">Catatan (Opsional)</label>
                  <input
                    id="newNote"
                    type="text"
                    className="input"
                    placeholder="mis. Iuran pertama..."
                    value={addNote}
                    onChange={(e) => setAddNote(e.target.value)}
                  />
                </div>
                {error && (
                  <p
                    style={{
                      color: "#DC2626",
                      fontSize: "0.82rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {error}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "0.875rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewPersonForm(false);
                      setNewPersonName("");
                      setNewPersonEmoji("🐷");
                      setAddAmount("");
                      setAddNote("");
                      setAddPayment("cash");
                      setError("");
                      setShowNewEmojiPicker(false);
                    }}
                    className="btn btn-secondary w-full"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewPerson}
                    className="btn btn-primary w-full"
                    disabled={submitting}
                    style={{ fontSize: "0.875rem" }}
                  >
                    {submitting ? "Nyimpen..." : "Tambah 🎉"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowNewPersonForm(true);
                  setExpandedName(null);
                  setAddFormName(null);
                  setAddAmount("");
                  setAddNote("");
                  setAddPayment("cash");
                }}
                className="btn btn-primary w-full"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  fontSize: "0.95rem",
                }}
              >
                <UserPlus size={17} /> Tambah Anggota Baru
              </button>
            ))}
        </div>
      </section>
      <footer
        style={{
          marginTop: "1.5rem",
          textAlign: "center",
          padding: "1rem 0 0",
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        <a
          href="https://github.com/kharismutaqin/tabungin"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "inherit",
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          <FontAwesomeIcon icon={faGithub} />
          source code
        </a>
      </footer>
    </div>
  );
};
