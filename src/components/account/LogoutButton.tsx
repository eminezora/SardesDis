import { logout } from "@/actions/auth";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-[0.9375rem] text-muted underline decoration-stone-deep underline-offset-4 hover:text-forest"
      >
        Çıkış yap
      </button>
    </form>
  );
}
