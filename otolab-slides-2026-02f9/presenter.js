// スライドを全画面で1枚ずつ送る「プレゼンモード」。解説動画の収録用。
//
//   P … 開始（もう一度押すか Esc で戻る）
//   → / ↓ / Space / クリック … 次へ      ← / ↑ … 前へ
//   L … 次のレッスンの先頭へ            Shift+L … 前のレッスンの先頭へ
//   F … ブラウザの全画面のON/OFF
//
// 現在地は**スライドの中の右下**に出す（画面の外に帯を出さない）。
// 受講生が動画で見てもページ番号にしか見えない見た目にして、
// **その回の最後の1枚だけ色が変わる**＝収録を止める合図にしている。
//
// 拡大は vw/vh ではなく「実寸1200pxで描いて transform で倍率をかける」方式。
// 画面の単位で組むと、ウィンドウの形やブラウザのズームによって文字が小さくなることがあるため。
(() => {
	const BASE_W = 1200; // 実寸。slide.css の .pm-* と揃えること
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

	// 現在地の表示を1枚ずつに埋め込む（スライドの中に入れるので、拡大すると一緒に大きくなる）
	slides.forEach((s) => {
		const inner = s.querySelector(".inner") || s;
		if (inner.querySelector(".pm-mark")) return;
		const mark = document.createElement("span");
		mark.className = "pm-mark";
		inner.append(mark);
	});

	let at = 0;
	let on = false;

	// ウィンドウに収まる倍率を出して拡大する
	const fit = () => {
		const el = slides[at];
		if (!el) return;
		const h = el.getBoundingClientRect().height / (el.dataset.pmScale || 1);
		const nat = h || (BASE_W * 9) / 16;
		const k = Math.min(window.innerWidth / BASE_W, window.innerHeight / nat);
		el.dataset.pmScale = k;
		el.style.transform = `translate(-50%,-50%) scale(${k})`;
	};

	const draw = () => {
		slides.forEach((s) => {
			s.classList.remove("is-live");
			s.style.transform = "";
			delete s.dataset.pmScale;
		});
		const cur = slides[at];
		cur.classList.add("is-live");
		const i = infoOf(cur);
		const mark = cur.querySelector(".pm-mark");
		if (mark) {
			// レッスン番号は出さない（スライドに STEP 4-1 のピルが既にあるので重複する）
			mark.textContent = i.label ? `${i.no} / ${i.total}` : `${i.no} / ${slides.length}`;
			mark.classList.toggle("is-end", i.last);
		}
		fit();
	};

	const start = () => {
		on = true;
		document.body.classList.add("present");
		draw();
	};
	const stop = () => {
		on = false;
		document.body.classList.remove("present");
		slides.forEach((s) => {
			s.classList.remove("is-live");
			s.style.transform = "";
		});
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
		if (next !== undefined) {
			at = next;
			draw();
		}
	};

	document.addEventListener("keydown", (e) => {
		if (e.key === "p" || e.key === "P") return on ? stop() : start();
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
	window.addEventListener("resize", () => on && fit());

	const hint = document.createElement("div");
	hint.className = "pm-hint";
	hint.textContent = "P で全画面プレゼン（←→ で送る）";
	document.body.append(hint);
})();
