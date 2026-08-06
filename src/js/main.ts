import "../css/main.css";
import "iconify-icon";

type SearchHit = {
  title?: string;
  description?: string;
  content?: string;
  permalink?: string;
};

type SearchResult = {
  hits?: SearchHit[];
  total?: number;
};

type CurrentUserDetail = {
  user?: {
    metadata?: {
      name?: string;
    };
    spec?: {
      avatar?: string;
      displayName?: string;
    };
  };
};

type NotificationList = {
  items?: unknown[];
  total?: number;
};

const searchEndpoint = "/apis/api.halo.run/v1alpha1/indices/-/search";
const currentUserEndpoint = "/apis/api.console.halo.run/v1alpha1/users/-";
const colorSchemeStorageKey = "halo-theme-github-color-scheme";
let currentUserRequest: Promise<CurrentUserDetail | undefined> | undefined;

const getCurrentUser = () => {
  currentUserRequest ??= fetch(currentUserEndpoint)
    .then((response) => (response.ok ? (response.json() as Promise<CurrentUserDetail>) : undefined))
    .catch(() => undefined);

  return currentUserRequest;
};

const setupThemeToggle = () => {
  const trigger = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");

  if (!trigger) {
    return;
  }

  let colorScheme = "light";

  try {
    colorScheme = localStorage.getItem(colorSchemeStorageKey) === "dark" ? "dark" : "light";
  } catch {
    colorScheme = "light";
  }

  const applyColorScheme = (scheme: string) => {
    const isDark = scheme === "dark";
    document.documentElement.dataset.colorScheme = isDark ? "dark" : "light";
    trigger.setAttribute("aria-pressed", String(isDark));
    trigger.setAttribute("aria-label", isDark ? "切换到日间模式" : "切换到黑夜模式");
  };

  applyColorScheme(colorScheme);

  trigger.addEventListener("click", () => {
    colorScheme = colorScheme === "dark" ? "light" : "dark";
    applyColorScheme(colorScheme);

    try {
      localStorage.setItem(colorSchemeStorageKey, colorScheme);
    } catch {
      // The selected mode still applies for the current page when storage is unavailable.
    }
  });
};

const normalizeMenuPath = (path: string | null | undefined) => {
  const value = (path || "").trim();

  if (!value) {
    return "/";
  }

  try {
    const url = new URL(value, window.location.origin);
    const pathname = url.pathname || "/";
    return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  } catch {
    const pathname = value.startsWith("/") ? value : `/${value}`;
    return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  }
};

const setupCustomMenuIcons = () => {
  const rules = new Map<string, string>();

  document
    .querySelectorAll<HTMLElement>("[data-menu-icon-rules] [data-menu-path][data-menu-icon]")
    .forEach((rule) => {
      const icon = rule.dataset.menuIcon?.trim();

      if (!icon) {
        return;
      }

      rules.set(normalizeMenuPath(rule.dataset.menuPath), icon);
    });

  if (!rules.size) {
    return;
  }

  document
    .querySelectorAll<HTMLAnchorElement>(".profile-tabs a[data-menu-href]")
    .forEach((item) => {
      const icon = rules.get(normalizeMenuPath(item.dataset.menuHref || item.getAttribute("href")));
      const iconElement = item.querySelector("iconify-icon");

      if (icon && iconElement) {
        iconElement.setAttribute("icon", icon);
      }
    });
};

const setupActiveMenuItem = () => {
  const currentPath = normalizeMenuPath(window.location.pathname);

  document
    .querySelectorAll<HTMLAnchorElement>(".profile-tabs a[data-menu-href]")
    .forEach((item) => {
      const menuPath = normalizeMenuPath(item.dataset.menuHref || item.getAttribute("href"));
      const isCurrent =
        menuPath === "/"
          ? currentPath === "/"
          : currentPath === menuPath || currentPath.startsWith(`${menuPath}/`);

      if (isCurrent) {
        item.classList.add("is-active");
      }
    });
};

const setupLinkLogoFallbacks = () => {
  document.querySelectorAll<HTMLImageElement>("img[data-link-logo]").forEach((image) => {
    const fallback = image.dataset.linkFallback?.trim();
    let fallbackAttempted = !fallback || image.getAttribute("src") === fallback;

    const showFallback = () => {
      if (!fallbackAttempted && fallback) {
        fallbackAttempted = true;
        image.src = fallback;
        return;
      }

      image.classList.add("is-invalid");
    };

    image.addEventListener("error", showFallback);

    if (image.complete && image.naturalWidth === 0) {
      showFallback();
    }
  });
};

const setupNotificationIndicator = () => {
  const link = document.querySelector<HTMLAnchorElement>("[data-notification-link]");
  const dot = link?.querySelector<HTMLElement>("[data-notification-dot]");

  if (!link || !dot) {
    return;
  }

  let username: string | undefined;
  let checking = false;

  const setUnreadState = (hasUnread: boolean) => {
    dot.hidden = !hasUnread;

    if (hasUnread) {
      link.title = "有未读消息";
    } else {
      link.removeAttribute("title");
    }
  };

  const getCurrentUsername = async () => {
    if (username) {
      return username;
    }

    const currentUser = await getCurrentUser();
    const name = currentUser?.user?.metadata?.name;

    if (!name || name === "anonymousUser") {
      return undefined;
    }

    username = name;
    return username;
  };

  const checkUnreadNotifications = async () => {
    if (checking) {
      return;
    }

    checking = true;

    try {
      const currentUsername = await getCurrentUsername();
      if (!currentUsername) {
        setUnreadState(false);
        return;
      }

      const endpoint =
        `/apis/api.notification.halo.run/v1alpha1/userspaces/${encodeURIComponent(currentUsername)}` +
        "/notifications?page=1&size=1&fieldSelector=spec.unread%3Dtrue";
      const response = await fetch(endpoint);

      if (!response.ok) {
        setUnreadState(false);
        return;
      }

      const notifications = (await response.json()) as NotificationList;
      setUnreadState((notifications.total ?? notifications.items?.length ?? 0) > 0);
    } catch {
      setUnreadState(false);
    } finally {
      checking = false;
    }
  };

  void checkUnreadNotifications();
  window.setInterval(() => void checkUnreadNotifications(), 30_000);
  window.addEventListener("focus", () => void checkUnreadNotifications());
};

const setupUserMenu = async () => {
  const container = document.querySelector<HTMLElement>("[data-user-menu]");
  const loginLink = container?.querySelector<HTMLAnchorElement>("[data-login-link]");
  const trigger = container?.querySelector<HTMLButtonElement>("[data-user-menu-trigger]");
  const menu = container?.querySelector<HTMLElement>("[data-user-menu-list]");
  const avatar = trigger?.querySelector<HTMLImageElement>("[data-user-avatar]");

  if (!container || !loginLink || !trigger || !menu || !avatar) {
    return;
  }

  loginLink.href = `/login?redirect_uri=${encodeURIComponent(window.location.href)}`;

  const currentUser = await getCurrentUser();
  const username = currentUser?.user?.metadata?.name;

  if (!username || username === "anonymousUser") {
    return;
  }

  const fallbackAvatar = avatar.currentSrc || avatar.src;
  avatar.removeAttribute("srcset");
  avatar.removeAttribute("sizes");
  avatar.src = currentUser.user?.spec?.avatar || fallbackAvatar;
  avatar.alt = currentUser.user?.spec?.displayName || username;
  avatar.addEventListener("error", () => {
    if (avatar.src !== fallbackAvatar) {
      avatar.src = fallbackAvatar;
    }
  });
  loginLink.hidden = true;
  trigger.hidden = false;

  let closeTimer = 0;

  const closeMenu = (restoreFocus = false) => {
    window.clearTimeout(closeTimer);
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");

    if (restoreFocus) {
      trigger.focus();
    }
  };

  const openMenu = (focusFirstItem = false) => {
    window.clearTimeout(closeTimer);
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");

    if (focusFirstItem) {
      menu.querySelector<HTMLAnchorElement>("a")?.focus();
    }
  };

  container.addEventListener("pointerenter", () => openMenu());
  container.addEventListener("pointerleave", () => {
    closeTimer = window.setTimeout(() => closeMenu(), 120);
  });
  trigger.addEventListener("click", () => {
    if (menu.hidden) {
      openMenu(true);
    }
  });
  document.addEventListener("click", (event) => {
    if (!menu.hidden && event.target instanceof Node && !container.contains(event.target)) {
      closeMenu();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      closeMenu(true);
    }
  });
};

const setupPublishMenu = () => {
  const trigger = document.querySelector<HTMLButtonElement>("[data-publish-menu-trigger]");
  const menu = document.querySelector<HTMLElement>("[data-publish-menu]");
  const container = trigger?.closest<HTMLElement>(".publish-menu");

  if (!trigger || !menu || !container) {
    return;
  }

  let closeTimer = 0;

  const closeMenu = (restoreFocus = false) => {
    window.clearTimeout(closeTimer);
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");

    if (restoreFocus) {
      trigger.focus();
    }
  };

  const openMenu = (focusFirstItem = false) => {
    window.clearTimeout(closeTimer);
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");

    if (focusFirstItem) {
      menu.querySelector<HTMLAnchorElement>("a")?.focus();
    }
  };

  trigger.addEventListener("click", () => {
    if (menu.hidden) {
      openMenu(true);
    }
  });

  container.addEventListener("pointerenter", () => openMenu());
  container.addEventListener("pointerleave", () => {
    closeTimer = window.setTimeout(() => closeMenu(), 120);
  });

  document.addEventListener("click", (event) => {
    if (!menu.hidden && event.target instanceof Node && !container.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      closeMenu(true);
    }
  });
};

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
};

const createResultItem = (hit: SearchHit) => {
  const link = document.createElement("a");
  link.className = "search-result-item";
  link.href = hit.permalink || "#";

  const title = document.createElement("span");
  title.className = "search-result-title";
  title.textContent = hit.title || "Untitled";

  const description = document.createElement("span");
  description.className = "search-result-desc";
  description.textContent = hit.description || hit.content || "No description provided.";

  link.append(title, description);
  return link;
};

const setupSearch = () => {
  const trigger = document.querySelector<HTMLButtonElement>("[data-search-trigger]");
  const overlay = document.querySelector<HTMLElement>("[data-search-overlay]");
  const form = document.querySelector<HTMLFormElement>("[data-search-form]");
  const input = document.querySelector<HTMLInputElement>("[data-search-input]");
  const closeButton = document.querySelector<HTMLButtonElement>("[data-search-close]");
  const status = document.querySelector<HTMLElement>("[data-search-status]");
  const results = document.querySelector<HTMLElement>("[data-search-results]");

  if (!trigger || !overlay || !form || !input || !closeButton || !status || !results) {
    return;
  }

  let debounceTimer = 0;
  let controller: AbortController | undefined;

  const openSearch = () => {
    overlay.hidden = false;
    document.documentElement.classList.add("search-open");
    input.focus();
  };

  const closeSearch = () => {
    overlay.hidden = true;
    document.documentElement.classList.remove("search-open");
    input.value = "";
    status.textContent = "输入关键词搜索";
    results.replaceChildren();
    controller?.abort();
  };

  const renderResults = (data: SearchResult, keyword: string) => {
    results.replaceChildren();

    if (!data.hits?.length) {
      status.textContent = `没有找到与 “${keyword}” 相关的内容`;
      return;
    }

    status.textContent = `找到 ${data.total ?? data.hits.length} 条结果`;
    results.append(...data.hits.map(createResultItem));
  };

  const search = async () => {
    const keyword = input.value.trim();
    controller?.abort();

    if (!keyword) {
      status.textContent = "输入关键词搜索";
      results.replaceChildren();
      return;
    }

    controller = new AbortController();
    status.textContent = "搜索中...";

    try {
      const response = await fetch(searchEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword,
          limit: 8,
          filterExposed: true,
          filterPublished: true,
          filterRecycled: false,
          includeTypes: ["post.content.halo.run", "singlepage.content.halo.run"],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      renderResults((await response.json()) as SearchResult, keyword);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      status.textContent = "搜索暂时不可用";
    }
  };

  trigger.addEventListener("click", openSearch);
  closeButton.addEventListener("click", closeSearch);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeSearch();
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void search();
  });
  input.addEventListener("input", () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => void search(), 220);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) {
      closeSearch();
    }

    if (event.key === "/" && overlay.hidden && !isTypingTarget(event.target)) {
      event.preventDefault();
      openSearch();
    }
  });
};

setupCustomMenuIcons();
setupThemeToggle();
setupActiveMenuItem();
setupLinkLogoFallbacks();
setupNotificationIndicator();
setupPublishMenu();
void setupUserMenu();
setupSearch();
