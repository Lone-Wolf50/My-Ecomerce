

export async function deleteAccountCascade(supabase, uuid) {
  try {
    if (!uuid) throw new Error("No user UUID provided.");

    /* ── Step 1: Wipe order_items for every order this user owns ── */
    const { data: userOrders, error: fetchErr } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", uuid);

    if (fetchErr) throw fetchErr;

    if (userOrders && userOrders.length > 0) {
      const orderIds = userOrders.map((o) => o.id);
      const { error: itemsErr } = await supabase
        .from("order_items")
        .delete()
        .in("order_id", orderIds);
      if (itemsErr) throw itemsErr;
    }

    /* ── Step 2: Wipe active_sessions_cart ── */
    const { error: cartErr } = await supabase
      .from("active_sessions_cart")
      .delete()
      .eq("user_id", uuid);
    if (cartErr) throw cartErr;

    /* ── Step 3: Wipe orders ── */
    const { error: ordersErr } = await supabase
      .from("orders")
      .delete()
      .eq("user_id", uuid);
    if (ordersErr) throw ordersErr;

    /* ── Step 4: Wipe the profile itself ── */
    const { error: profileErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", uuid);
    if (profileErr) throw profileErr;

    return { success: true };
  } catch (err) {
    console.error("[deleteAccountCascade] Error:", err.message);
    return { success: false, error: err.message };
  }
}