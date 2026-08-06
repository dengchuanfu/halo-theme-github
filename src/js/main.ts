import "../css/main.css";
import "../css/about.css";
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
const momentUpvoteEndpoint = "/apis/api.halo.run/v1alpha1/trackers/upvote";
const colorSchemeStorageKey = "halo-theme-github-color-scheme";
const momentUpvoteStorageKey = "halo.upvoted.moment.names";
const postUpvoteStorageKey = "halo.upvoted.post.names";
let currentUserRequest: Promise<CurrentUserDetail | undefined> | undefined;

const getCurrentUser = () => {
  currentUserRequest ??= fetch(currentUserEndpoint)
    .then((response) => (response.ok ? (response.json() as Promise<CurrentUserDetail>) : undefined))
    .catch(() => undefined);

  return currentUserRequest;
};

const setupThemeToggle = () => {
  const trigger = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  const icon = trigger?.querySelector<HTMLElement>("iconify-icon");

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
    trigger.title = isDark ? "切换到日间模式" : "切换到黑夜模式";
    icon?.setAttribute("icon", isDark ? "solar:moon-line-duotone" : "solar:sun-linear");
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

const setupSiteTimeline = () => {
  const timeline = document.querySelector<HTMLElement>("[data-site-timeline]");
  const progress = timeline?.querySelector<HTMLElement>("[data-site-progress]");
  const percent = timeline?.querySelector<HTMLElement>("[data-site-percent]");
  const age = timeline?.querySelector<HTMLElement>("[data-site-age]");
  const target = timeline?.querySelector<HTMLElement>("[data-site-target]");

  if (!timeline || !progress || !percent || !age || !target) {
    return;
  }

  const start = new Date(`${timeline.dataset.start}T00:00:00`);
  const end = new Date(`${timeline.dataset.end}T00:00:00`);
  const now = new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return;
  }

  const elapsed = Math.max(0, now.getTime() - start.getTime());
  const duration = end.getTime() - start.getTime();
  const elapsedDays = Math.floor(elapsed / 86_400_000);
  const durationYears = duration / (365.2425 * 86_400_000);
  const progressValue = Math.min(100, Math.max(0, (elapsed / duration) * 100));

  progress.style.width = `${progressValue}%`;
  percent.textContent = `${progressValue.toFixed(2)}%`;
  age.textContent = `${elapsedDays} 天`;
  target.textContent = `目标：${Number.isInteger(durationYears) ? durationYears : durationYears.toFixed(1)} 年`;
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

const setupMomentImagePreview = () => {
  const images = document.querySelectorAll<HTMLImageElement>("img[data-moment-image]");

  if (!images.length) {
    return;
  }

  let preview: HTMLElement | undefined;

  const closePreview = () => {
    preview?.remove();
    preview = undefined;
    document.documentElement.classList.remove("image-preview-open");
  };

  images.forEach((image) => {
    image.addEventListener("click", () => {
      const source = image.currentSrc || image.src;

      if (!source) {
        return;
      }

      closePreview();
      preview = document.createElement("div");
      preview.className = "image-preview";
      preview.setAttribute("role", "dialog");
      preview.setAttribute("aria-modal", "true");
      preview.setAttribute("aria-label", "图片预览");

      const previewImage = document.createElement("img");
      previewImage.src = source;
      previewImage.alt = image.alt;

      const closeButton = document.createElement("button");
      closeButton.className = "image-preview-close";
      closeButton.type = "button";
      closeButton.title = "关闭预览";
      closeButton.setAttribute("aria-label", "关闭预览");
      const closeIcon = document.createElement("iconify-icon");
      closeIcon.setAttribute("icon", "material-symbols:close");
      closeButton.append(closeIcon);
      closeButton.addEventListener("click", closePreview);

      preview.append(previewImage, closeButton);
      preview.addEventListener("click", (event) => {
        if (event.target === preview) {
          closePreview();
        }
      });
      document.body.append(preview);
      document.documentElement.classList.add("image-preview-open");
      closeButton.focus();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && preview) {
      closePreview();
    }
  });
};

const setupMomentUpvotes = () => {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-moment-upvote]"));

  if (!buttons.length) {
    return;
  }

  let upvotedNames: string[] = [];

  try {
    const savedNames = JSON.parse(localStorage.getItem(momentUpvoteStorageKey) || "[]");
    upvotedNames = Array.isArray(savedNames)
      ? savedNames.filter((name): name is string => typeof name === "string")
      : [];
  } catch {
    upvotedNames = [];
  }

  const setUpvotedState = (button: HTMLButtonElement, upvoted: boolean) => {
    button.classList.toggle("is-upvoted", upvoted);
    button.setAttribute("aria-pressed", String(upvoted));
    button.setAttribute("aria-label", upvoted ? "已点赞" : "点赞瞬间");
    button.title = upvoted ? "已点赞" : "点赞";
  };

  buttons.forEach((button) => {
    const name = button.dataset.momentUpvote;

    if (!name) {
      return;
    }

    setUpvotedState(button, upvotedNames.includes(name));

    button.addEventListener("click", async () => {
      if (upvotedNames.includes(name) || button.disabled) {
        return;
      }

      button.disabled = true;

      try {
        const response = await fetch(momentUpvoteEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            group: "moment.halo.run",
            plural: "moments",
            name,
          }),
        });

        if (!response.ok) {
          throw new Error(`Moment upvote failed: ${response.status}`);
        }

        upvotedNames = [...upvotedNames, name];

        try {
          localStorage.setItem(momentUpvoteStorageKey, JSON.stringify(upvotedNames));
        } catch {
          // The current page still reflects the successful upvote when storage is unavailable.
        }

        buttons
          .filter((item) => item.dataset.momentUpvote === name)
          .forEach((item) => {
            const count = item.querySelector<HTMLElement>("[data-moment-upvote-count]");
            const current = Number.parseInt(count?.textContent || "0", 10);

            if (count) {
              count.textContent = String(Number.isNaN(current) ? 1 : current + 1);
            }

            setUpvotedState(item, true);
          });
      } catch {
        window.alert("点赞失败，请稍后再试");
      } finally {
        button.disabled = false;
      }
    });
  });
};

const setupPostUpvotes = () => {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-post-upvote]"));

  if (!buttons.length) {
    return;
  }

  let upvotedNames: string[] = [];

  try {
    const savedNames = JSON.parse(localStorage.getItem(postUpvoteStorageKey) || "[]");
    upvotedNames = Array.isArray(savedNames)
      ? savedNames.filter((name): name is string => typeof name === "string")
      : [];
  } catch {
    upvotedNames = [];
  }

  const setUpvotedState = (button: HTMLButtonElement, upvoted: boolean) => {
    button.classList.toggle("is-upvoted", upvoted);
    button.setAttribute("aria-pressed", String(upvoted));
    button.setAttribute("aria-label", upvoted ? "已点赞" : "点赞文章");
    button.title = upvoted ? "已点赞" : "点赞";
  };

  buttons.forEach((button) => {
    const name = button.dataset.postUpvote;

    if (!name) {
      return;
    }

    setUpvotedState(button, upvotedNames.includes(name));

    button.addEventListener("click", async () => {
      if (upvotedNames.includes(name) || button.disabled) {
        return;
      }

      button.disabled = true;

      try {
        const response = await fetch(momentUpvoteEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            group: "content.halo.run",
            plural: "posts",
            name,
          }),
        });

        if (!response.ok) {
          throw new Error(`Post upvote failed: ${response.status}`);
        }

        upvotedNames = [...upvotedNames, name];

        try {
          localStorage.setItem(postUpvoteStorageKey, JSON.stringify(upvotedNames));
        } catch {
          // The current page still reflects the successful upvote when storage is unavailable.
        }

        buttons
          .filter((item) => item.dataset.postUpvote === name)
          .forEach((item) => {
            const count = item.querySelector<HTMLElement>("[data-post-upvote-count]");
            const current = Number.parseInt(count?.textContent || "0", 10);

            if (count) {
              count.textContent = String(Number.isNaN(current) ? 1 : current + 1);
            }

            setUpvotedState(item, true);
          });
      } catch {
        window.alert("点赞失败，请稍后再试");
      } finally {
        button.disabled = false;
      }
    });
  });
};

const setupRepositoryFilters = () => {
  const list = document.querySelector<HTMLUListElement>(".repository-list");
  const triggers = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-repository-filter]"),
  );
  const items = Array.from(list?.querySelectorAll<HTMLLIElement>("[data-repository-title]") || []);

  if (!list || !triggers.length || !items.length) {
    return;
  }

  type FilterKind = "category" | "tag" | "sort";
  type SortOrder = "newest" | "oldest" | "title";
  type TaxonomyListResult = {
    items?: Array<{
      spec?: {
        displayName?: string;
      };
    }>;
    totalPages?: number;
  };
  type RepositoryItem = {
    categories: string[];
    date: number;
    element: HTMLLIElement;
    tags: string[];
    title: string;
  };

  const repositoryItems: RepositoryItem[] = items.map((element) => ({
    categories: Array.from(
      element.querySelectorAll<HTMLAnchorElement>(".repository-list-meta a"),
    ).map((link) => link.textContent?.trim() || ""),
    date: Date.parse(element.dataset.repositoryDate || "") || 0,
    element,
    tags: Array.from(element.querySelectorAll<HTMLAnchorElement>(".repository-title-tag")).map(
      (link) => link.textContent?.trim() || "",
    ),
    title: element.dataset.repositoryTitle?.trim() || "",
  }));
  let categories = Array.from(
    new Set(repositoryItems.flatMap(({ categories }) => categories).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right, "zh-CN"));
  let tags = Array.from(new Set(repositoryItems.flatMap(({ tags }) => tags).filter(Boolean))).sort(
    (left, right) => left.localeCompare(right, "zh-CN"),
  );
  const labels: Record<FilterKind, string> = {
    category: "分类",
    sort: "排序",
    tag: "标签",
  };
  const filters: { category?: string; sort: SortOrder; tag?: string } = { sort: "newest" };
  let menu: HTMLElement | undefined;
  let closeTimer = 0;

  const fetchTaxonomyNames = async (endpoint: string) => {
    const names: string[] = [];
    let page = 1;
    let totalPages = 1;

    try {
      do {
        const response = await fetch(`${endpoint}?page=${page}&size=100`);

        if (!response.ok) {
          return [];
        }

        const result = (await response.json()) as TaxonomyListResult;
        names.push(
          ...(result.items || [])
            .map((item) => item.spec?.displayName?.trim() || "")
            .filter(Boolean),
        );
        totalPages = Math.max(1, result.totalPages || 1);
        page += 1;
      } while (page <= totalPages);
    } catch {
      return [];
    }

    return Array.from(new Set(names)).sort((left, right) => left.localeCompare(right, "zh-CN"));
  };

  void Promise.all([
    fetchTaxonomyNames("/apis/api.content.halo.run/v1alpha1/categories"),
    fetchTaxonomyNames("/apis/api.content.halo.run/v1alpha1/tags"),
  ]).then(([loadedCategories, loadedTags]) => {
    if (loadedCategories.length) {
      categories = loadedCategories;
    }

    if (loadedTags.length) {
      tags = loadedTags;
    }
  });

  const closeMenu = () => {
    window.clearTimeout(closeTimer);
    menu?.remove();
    menu = undefined;
    triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
  };

  const scheduleClose = () => {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(closeMenu, 120);
  };

  const updateLabels = () => {
    triggers.forEach((trigger) => {
      const kind = trigger.dataset.repositoryFilter as FilterKind | undefined;
      const label = trigger.querySelector<HTMLElement>("[data-repository-filter-label]");

      if (!kind || !label) {
        return;
      }

      if (kind === "category") {
        label.textContent = filters.category || labels.category;
      } else if (kind === "tag") {
        label.textContent = filters.tag || labels.tag;
      } else {
        label.textContent =
          filters.sort === "oldest"
            ? "最早发布"
            : filters.sort === "title"
              ? "标题 A-Z"
              : labels.sort;
      }
    });
  };

  const applyFilters = () => {
    const sorted = [...repositoryItems].sort((left, right) => {
      if (filters.sort === "oldest") {
        return left.date - right.date;
      }

      if (filters.sort === "title") {
        return left.title.localeCompare(right.title, "zh-CN");
      }

      return right.date - left.date;
    });

    sorted.forEach((item) => {
      const categoryMatches = !filters.category || item.categories.includes(filters.category);
      const tagMatches = !filters.tag || item.tags.includes(filters.tag);
      item.element.hidden = !(categoryMatches && tagMatches);
      list.append(item.element);
    });

    updateLabels();
  };

  const option = (label: string, value: string, active: boolean) => {
    const button = document.createElement("button");
    button.className = "repository-filter-option";
    button.type = "button";
    button.textContent = label;
    button.dataset.value = value;
    button.classList.toggle("is-active", active);
    return button;
  };

  const openMenu = (trigger: HTMLButtonElement, kind: FilterKind) => {
    window.clearTimeout(closeTimer);

    if (menu && trigger.getAttribute("aria-expanded") === "true") {
      return;
    }

    closeMenu();
    menu = document.createElement("div");
    menu.className = "repository-filter-menu";
    menu.setAttribute("role", "menu");

    const options =
      kind === "category"
        ? [
            option("全部分类", "", !filters.category),
            ...categories.map((name) => option(name, name, filters.category === name)),
          ]
        : kind === "tag"
          ? [
              option("全部标签", "", !filters.tag),
              ...tags.map((name) => option(name, name, filters.tag === name)),
            ]
          : [
              option("最新发布", "newest", filters.sort === "newest"),
              option("最早发布", "oldest", filters.sort === "oldest"),
              option("标题 A-Z", "title", filters.sort === "title"),
            ];

    menu.append(...options);
    document.body.append(menu);
    const rect = trigger.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${Math.min(rect.left, window.innerWidth - menu.offsetWidth - 8)}px`;
    trigger.setAttribute("aria-expanded", "true");

    menu.addEventListener("pointerenter", () => window.clearTimeout(closeTimer));
    menu.addEventListener("pointerleave", scheduleClose);

    menu.addEventListener("click", (event) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-value]");

      if (!target) {
        return;
      }

      if (kind === "category") {
        filters.category = target.dataset.value || undefined;
      } else if (kind === "tag") {
        filters.tag = target.dataset.value || undefined;
      } else {
        filters.sort = (target.dataset.value as SortOrder) || "newest";
      }

      applyFilters();
      closeMenu();
    });
  };

  triggers.forEach((trigger) => {
    const openTriggerMenu = () => {
      const kind = trigger.dataset.repositoryFilter as FilterKind | undefined;

      if (kind) {
        openMenu(trigger, kind);
      }
    };

    trigger.addEventListener("pointerenter", openTriggerMenu);
    trigger.addEventListener("pointerleave", scheduleClose);
    trigger.addEventListener("focus", openTriggerMenu);
  });
  document.addEventListener("click", (event) => {
    const clickTarget = event.target;

    if (
      menu &&
      clickTarget instanceof Node &&
      !menu.contains(clickTarget) &&
      !triggers.some((trigger) => trigger.contains(clickTarget))
    ) {
      closeMenu();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu) {
      closeMenu();
    }
  });

  applyFilters();
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
  const triggers = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-search-trigger]"),
  );
  const overlay = document.querySelector<HTMLElement>("[data-search-overlay]");
  const form = document.querySelector<HTMLFormElement>("[data-search-form]");
  const input = document.querySelector<HTMLInputElement>("[data-search-input]");
  const closeButton = document.querySelector<HTMLButtonElement>("[data-search-close]");
  const status = document.querySelector<HTMLElement>("[data-search-status]");
  const results = document.querySelector<HTMLElement>("[data-search-results]");

  if (!triggers.length || !overlay || !form || !input || !closeButton || !status || !results) {
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

  triggers.forEach((trigger) => trigger.addEventListener("click", openSearch));
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
setupSiteTimeline();
setupActiveMenuItem();
setupLinkLogoFallbacks();
setupMomentImagePreview();
setupMomentUpvotes();
setupPostUpvotes();
setupRepositoryFilters();
setupNotificationIndicator();
setupPublishMenu();
void setupUserMenu();
setupSearch();
