type CommentOwner = {
  avatar?: string;
  displayName?: string;
};

type HaloComment = {
  metadata?: {
    name?: string;
  };
  owner?: CommentOwner;
  spec?: {
    approved?: boolean;
    content?: string;
    creationTime?: string;
    hidden?: boolean;
  };
};

type CommentList = {
  items?: HaloComment[];
  total?: number;
  totalPages?: number;
};

const commentEndpoint = "/apis/api.halo.run/v1alpha1/comments";
const commentDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
});

const getCommentText = (comment: HaloComment) => {
  const container = document.createElement("div");
  container.innerHTML = comment.spec?.content || "";
  return container.textContent?.replace(/\s+/g, " ").trim() || "留下一条消息";
};

const fetchComments = async (name: string) => {
  const comments: HaloComment[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const query = new URLSearchParams({
      group: "content.halo.run",
      kind: "SinglePage",
      name,
      page: String(page),
      size: "100",
    });
    const response = await fetch(`${commentEndpoint}?${query}`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Unable to load comments: ${response.status}`);
    }

    const result = (await response.json()) as CommentList;
    comments.push(...(result.items || []));
    totalPages = Math.max(1, result.totalPages || 1);
    page += 1;
  } while (page <= totalPages);

  return comments.filter((comment) => comment.spec?.approved !== false && !comment.spec?.hidden);
};

const createMessage = (comment: HaloComment, index: number, isDuplicate: boolean) => {
  const message = document.createElement("div");
  message.className = "floating-message";
  message.style.setProperty("--message-lane", String(index % 6));
  message.style.setProperty("--message-duration", `${16 + (index % 5) * 2}s`);
  message.style.setProperty("--message-delay", `${-(index * 3.7)}s`);

  if (isDuplicate) {
    message.setAttribute("aria-hidden", "true");
  }

  const avatar = document.createElement("span");
  avatar.className = "floating-message-avatar";

  if (comment.owner?.avatar) {
    const image = document.createElement("img");
    image.src = comment.owner.avatar;
    image.alt = "";
    image.loading = "lazy";
    avatar.append(image);
  } else {
    avatar.textContent = (comment.owner?.displayName || "访").slice(0, 1);
  }

  const body = document.createElement("span");
  body.className = "floating-message-body";

  const owner = document.createElement("strong");
  owner.textContent = comment.owner?.displayName || "访客";

  const content = document.createElement("span");
  content.textContent = getCommentText(comment);

  const time = document.createElement("time");
  const creationTime = comment.spec?.creationTime;
  if (creationTime) {
    const date = new Date(creationTime);
    time.dateTime = creationTime;
    time.textContent = Number.isNaN(date.getTime()) ? "" : commentDateFormatter.format(date);
  }

  body.append(owner, content, time);
  message.append(avatar, body);
  return message;
};

const setupMessageWall = () => {
  const root = document.querySelector<HTMLElement>("[data-message-wall]");
  const stage = root?.querySelector<HTMLElement>("[data-message-stage]");
  const status = root?.querySelector<HTMLElement>("[data-message-status]");
  const count = root?.querySelector<HTMLElement>("[data-message-count]");
  const name = root?.dataset.commentName;

  if (!root || !stage || !status || !count || !name) {
    return;
  }

  let signature = "";

  const refresh = async () => {
    if (document.hidden) {
      return;
    }

    try {
      const comments = await fetchComments(name);
      count.textContent = `${comments.length} 条留言`;

      if (!comments.length) {
        signature = "";
        stage.replaceChildren(status);
        status.hidden = false;
        status.querySelector("span")!.textContent = "还没有留言，来写下第一条吧。";
        return;
      }

      const nextSignature = comments
        .map((comment) => `${comment.metadata?.name}:${comment.spec?.creationTime}`)
        .join("|");

      if (nextSignature === signature) {
        return;
      }

      signature = nextSignature;
      const messageCount = Math.max(8, comments.length);
      const messages = Array.from({ length: messageCount }, (_, index) => {
        const comment = comments[index % comments.length];
        return createMessage(comment, index, index >= comments.length);
      });
      stage.replaceChildren(...messages);
    } catch {
      count.textContent = "留言暂不可用";
      stage.replaceChildren(status);
      status.hidden = false;
      status.querySelector("span")!.textContent = "留言加载失败，请稍后重试。";
    }
  };

  void refresh();
  window.setInterval(() => void refresh(), 30_000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      void refresh();
    }
  });
};

setupMessageWall();
