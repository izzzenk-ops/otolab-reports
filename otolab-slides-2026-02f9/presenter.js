// スライドを全画面で1枚ずつ送る「プレゼンモード」。解説動画の収録用。
//
//   P … 開始（もう一度押すか Esc で戻る）
//   → / ↓ / Space / クリック … 次へ      ← / ↑ … 前へ
//   L … 次のレッスンの先頭へ            Shift+L … 前のレッスンの先頭へ
//   F … ブラウザの全画面のON/OFF
//
// 1レッスンずつ撮るので、**その回の最後の1枚には「この回はここまで」を出す**。
// PDFに書き出さなくていいように作ってある（直したら次に開いた瞬間から最新）。
(() => {
	const slides = [...document.querySelectorAll(".slide")];
	if (!slides.length) return;

	// どのスライドがどのレッスンのものか。レッスンの見出し（<h2>5-1　…）で区切る。
	const lessons = [];
	document.querySelectorAll(".lesson h2").forEach((h) => {
		const m = h.textContent.trim().match(/^(\d+-\d+)/);
		const deck = h.closest(".lesson")?.nextElementSibling;
		if (!m || !deck || !deck.classList.contains("deck")) return;
		lessons.push({ label: m[1], slides: [...deck.querySelectorAll(".slide")] });
	});
	const infoOf = (el) => {
		for (const L of lessons) {
			const i = L.slides.indexOf(el);
			if (i >= 0) return { label: L.label, no: i + 1, total: L.slides.length, last: i === L.slides.length - 1 };
		}
		return { label: "", no: slides.indexOf(el) + 1, total: slides.length, last: false };
	};

	let at = 0;
	let on = false;
	const bar = document.createElement("div");
	bar.className = "pm-bar";
	const end = document.createElement("div");
	end.className = "pm-end";
	end.innerHTML = 'この回はここまで<small>収録を止めてください</small>';

	const draw = () => {
		slides.forEach((s) => s.classList.remove("is-live"));
		const cur = slides[at];
		cur.classList.add("is-live");
		cur.scrollIntoView({ block: "center" });
		const i = infoOf(cur);
		bar.innerHTML =
			`<span class="pm-lesson">${i.label || "表紙"}</span>` +
			`<span class="pm-num">${i.no} / ${i.total}</span>` +
			`<span class="pm-num" style="opacity:.55">全体 ${at + 1} / ${slides.length}</span>`;
		end.style.display = i.last ? "block" : "none";
	};

	const start = () => {
		on = true;
		document.body.classList.add("present");
		document.body.append(bar, end);
		draw();
	};
	const stop = () => {
		on = false;
		document.body.classList.remove("present");
		slides.forEach((s) => s.classList.remove("is-live"));
		bar.remove();
		end.remove();
		if (document.fullscreenElement) document.exitFullscreen();
		slides[at].scrollIntoView({ block: "center" });
	};
	const go = (d) => {
		at = Math.min(slides.length - 1, Math.max(0, at + d));
		draw();
	};
	// レッスンの先頭へ飛ぶ（撮り直しのとき用）
	const jumpLesson = (d) => {
		const heads = lessons.map((L) => slides.indexOf(L.slides[0])).filter((i) => i >= 0);
		const next = d > 0 ? heads.find((i) => i > at) : [...heads].reverse().find((i) => i < at);
		if (next !== undefined) { at = next; draw(); }
	};

	document.addEventListener("keydown", (e) => {
		if (e.key === "p" || e.key === "P") { on ? stop() : start(); return; }
		if (!on) return;
		if (e.key === "Escape") return stop();
		if (e.key === "f" || e.key === "F") {
			document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
			return;
		}
		if (e.key === "l" || e.key === "L") return jumpLesson(e.shiftKey ? -1 : 1);
		if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(e.key)) { e.preventDefault(); go(1); }
		if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); go(-1); }
	});
	document.addEventListener("click", (e) => {
		if (!on) return;
		go(e.clientX < window.innerWidth * 0.25 ? -1 : 1);
	});

	// 使い方の案内（プレゼン中は消える）
	const hint = document.createElement("div");
	hint.className = "pm-hint";
	hint.textContent = "P で全画面プレゼン（←→ で送る）";
	document.body.append(hint);
})();
