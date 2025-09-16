import { Renderer2 } from '@angular/core';
import { escapeHtml } from '../../utils/escape';

declare const THREE: any;

export interface CardData {
  id: string;
  title: string;
  meta: string;
  body: string;
  opts?: any;
  manualLayout?: boolean;
  layout: {
    scale: number;
    position: { x: number; y: number; z: number };
  };
}

export class CardListComponent {
  constructor(private renderer2: Renderer2) {}

  getVideoCardStyle(): any {
    return { width: '1280px', padding: '32px 16px' };
  }

  readonly CARD_DATA: CardData[] = [
    {
      id: 'personal-info-card',
      title: 'Thông tin cá nhân',
      meta: 'Personal Information',
      body: `<ul>${["Name: Lương Bảo Huy", "Titles: Video Producer · Graphic Designer · Photographer", "Role: Generalist", "AI Title Generation: Director of Artificial Intelligence"].map(g => `<li>${escapeHtml(g)}</li>`).join('')}</ul>`,
      opts: { noexpand: true, style: { width: '960px' } },
      layout: { scale: 0.6, position: { x: 0, y: 0, z: 0 } }
    },
    {
      id: 'harmony-card',
      title: 'Producer - Project Manager',
      meta: 'Harmony 2025 - Better With You',
      body: `<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;min-height:320px;"><iframe src="https://drive.google.com/file/d/1X-_4rjqvc4X_ZVYo5BYFDoEBzp_DtkwZ/preview" width="1280" height="720" title="Harmony 2025 – Better With You" style="border-radius:12px;border:none;box-shadow:0 4px 24px rgba(0,0,0,0.18);"></iframe></div>`,
      opts: { noexpand: true, style: this.getVideoCardStyle() },
      layout: { scale: 0.25, position: { x: 0, y: 240, z: -666 } }
    },
    {
      id: 'contact-card',
      title: 'Contact',
      meta: 'Thông tin liên lạc',
      body: `<ul><li><strong>Email</strong>: <a href=\"mailto:minatokiva@gmail.com\">minatokiva@gmail.com</a></li><li><strong>Zalo/ WhatsApp</strong>: <a href=\"tel:+84 704 5555 27\">+84 704 5555 27</a></li></ul>`,
      layout: { scale: 0.25, position: { x: 0, y: -240, z: -150 } }
    },
    {
      id: 'microlife-bts-card',
      title: 'Post-production supervisor',
      meta: 'Microlife Talkshow 2021 | Behind The Scene',
      body: `<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;min-height:320px;"><iframe width="1280" height="720" src="https://www.youtube.com/embed/_V3pAcQBhPo" title="Microlife Talkshow 2021 | Behind the scene" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`,
      opts: { noexpand: true, style: this.getVideoCardStyle() },
      layout: { scale: 0.25, position: { x: 240, y: 0, z: 0 } }
    },
    {
      id: 'external-ids-card',
      title: 'External IDs',
      meta: 'Social Network',
      body: `<ul>${[{ label: "LinkedIn", handle: "Lương Bảo Huy", url: "https://www.linkedin.com/in/b%E1%BA%A3o-huy-l%C6%B0%C6%A1ng-1653a41a3", status: "OK" }, { label: "Instagram", handle: "@minatomakoto", url: "https://www.instagram.com/minatomakoto", status: "OK" }, { label: "Facebook", handle: "Minato Makoto", url: "https://www.facebook.com/MinatoMakoto/", status: "OK" }, { label: "YouTube", handle: "@minatomakoto", url: "https://www.youtube.com/@minatomakoto", status: "OK" }, { label: "TikTok", handle: "@minatomakoto", url: "https://www.tiktok.com/@minatomakoto", status: "OK" }].map(e => `<li>${escapeHtml(e.label)}: <a href=\"${e.url}\" target=\"_blank\" rel=\"noopener\">${escapeHtml(e.handle)}</a></li>`).join('')}</ul>`,
      layout: { scale: 0.25, position: { x: 50, y: 100, z: 0 } }
    },
    {
      id: 'motor-fest-card',
      title: 'Post-production supervisor',
      meta: 'Motor Fest 2023',
      body: `<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;min-height:320px;"><iframe src="https://drive.google.com/file/d/1LHlJL_vV7l8I4_F-JIutWN8wlMhoGaEn/preview" width="1280" height="720" title="Motor Fest 2023" style="border-radius:12px;border:none;box-shadow:0 4px 24px rgba(0,0,0,0.18);"></iframe></div>`,
      opts: { noexpand: true, style: this.getVideoCardStyle() },
      layout: { scale: 0.25, position: { x: 0, y: 200, z: -600 } }
    },
    {
      id: 'digital-identity-card',
      title: 'Digital Identity',
      meta: 'Thông tin điện tử',
      body: `<ul><li><b>Latent ID</b>: 𝑍Σ̴𝐑Ø</li><li><b>GitHub</b>: <a href="https://github.com/Minato-Makoto" target="_blank" rel="noopener">Minato-Makoto</a></li></ul>`,
      layout: { scale: 0.25, position: { x: -150, y: 0, z: 0 } }
    },
    {
      id: 'mv-le-card',
      title: 'Post-Production Supervisor',
      meta: 'MV Lé - Dr Roc',
      body: `<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;min-height:320px;"><iframe src="https://drive.google.com/file/d/1yeMXF7wVZBWE2W7VHUQvHY1k7gREsfjD/preview" width="1280" height="720" title="MV Lé - Dr Roc" style="border-radius:12px;border:none;box-shadow:0 4px 24px rgba(0,0,0,0.18);"></iframe></div>`,
      opts: { noexpand: true, style: this.getVideoCardStyle() },
      layout: { scale: 0.25, position: { x: 0, y: -360, z: 0 } }
    },
    {
      id: 'dong-co-lau-card',
      title: 'Post-Production Supervisor',
      meta: 'ĐỒNG CỎ LAU - HÀNH TRÌNH TỪ ĐẤT TRỜI ĐẾN TỔ ẤM',
      body: `<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;min-height:320px;"><iframe src="https://drive.google.com/file/d/1cN1AkKCYtoxowWyVDofOIZlX4cZnrhGS/preview" width="1280" height="720" title="ĐỒNG CỎ LAU - HÀNH TRÌNH TỪ ĐẤT TRỜI ĐẾN TỔ ẤM" style="border-radius:12px;border:none;box-shadow:0 4px 24px rgba(0,0,0,0.18);"></iframe></div>`,
      opts: { noexpand: true, style: this.getVideoCardStyle() },
      layout: { scale: 0.25, position: { x: -420, y: 0, z: -240 } }
    },
    {
      id: 'doraemon-tvc-card',
      title: 'Post-Production Supervisor',
      meta: 'DORAEMON LIPICE SHEER COLOR',
      body: `<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;min-height:320px;"><iframe width="1280" height="720" src="https://www.youtube.com/embed/7w3royxjrtw?si=S8rAgrb9-OMhlpEs" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`,
      opts: { noexpand: true, style: this.getVideoCardStyle() },
      layout: { scale: 0.25, position: { x: -240, y: 0, z: 0 } }
    },
    {
      id: 'ThaiLong-card',
      title: 'Post-Production Supervisor',
      meta: 'Thái Long Yến Tiệc',
      body: `<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;min-height:320px;"><iframe src="https://drive.google.com/file/d/1oFDR_ff0AHRXJuIFiQy8suxvZNKuA_Bg/preview" width="1280" height="720" title="Thái Long Yến Tiệc" style="border-radius:12px;border:none;box-shadow:0 4px 24px rgba(0,0,0,0.18);"></iframe></div>`,
      opts: { noexpand: true, style: this.getVideoCardStyle() },
      manualLayout: true,
      layout: { scale: 0.25, position: { x: 360, y: 450, z: -150 } }
    },
    {
      id: 'hithegioi-card',
      title: 'Post-Production Supervisor',
      meta: 'BLACKA - Hi Thế Giới | No No No (OFFICIAL MUSIC VIDEO) ft. ARTHUR (CROW ON HYENAS)',
      body: `<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;min-height:320px;"><iframe width="1280" height="720" src="https://www.youtube.com/embed/wBWQsfxG4eE" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`,
      opts: { noexpand: true, style: this.getVideoCardStyle() },
      manualLayout: true,
      layout: { scale: 0.25, position: { x: 1000, y: 400, z: -600 } }
    },
    {
      id: 'daydream-card',
      title: 'Producer - Project Manager',
      meta: 'RECAP DAY DREAMS FINAL 2024!',
      body: `<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;min-height:320px;"><iframe src="https://drive.google.com/file/d/1PsYIUeHpntiBvQT1aYqrY8rd0KGJlU4B/preview" width="1280" height="720" title="RECAP DAY DREAMS FINAL 2024!" style="border-radius:12px;border:none;box-shadow:0 4px 24px rgba(0,0,0,0.18);"></iframe></div>`,
      opts: { noexpand: true, style: this.getVideoCardStyle() },
      manualLayout: true,
      layout: { scale: 0.25, position: { x: -600, y: 150, z: 0 } }
    },
    {
      id: '2ndchance-card',
      title: 'BTS - Producer Assistant',
      meta: 'The 2nd Chance - Hãy Thay Đổi Lối Sống, Yêu Thương & Lành Mạnh',
      body: `<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;min-height:320px;"><iframe width="1280" height="720" src="https://www.youtube.com/embed/5RVfxLfCHwg" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`,
      opts: { noexpand: true, style: this.getVideoCardStyle() },
      manualLayout: true,
      layout: { scale: 0.25, position: { x: -1000, y: 420, z: -240 } }
    },
    {
      id: 'PhongNguaDotQuy-card',
      title: 'BTS - Producer Assistant',
      meta: 'BẢO VỆ GIA ĐÌNH PHÒNG NGỪA ĐỘT QUỴ - NSƯT THÀNH LỘC, MC THANH GIANG, ThS.BS TRẦN CÔNG DUY',
      body: `<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;min-height:320px;"><iframe width="1280" height="720" src="https://www.youtube.com/embed/PPNA0KnOrNg" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`,
      opts: { noexpand: true, style: this.getVideoCardStyle() },
      manualLayout: true,
      layout: { scale: 0.25, position: { x: 700, y: 50, z: -300 } }
    }
  ];

  createCardEl(title: string, meta: string, body: string, opts: any = {}): HTMLElement {
    const el = this.renderer2.createElement('div');
    this.renderer2.addClass(el, 'card3d');
    if (opts.noexpand) this.renderer2.addClass(el, 'noexpand');
    el.innerHTML = `<h4>${escapeHtml(title)}</h4>${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ''}<div class="body">${body || ''}</div>`;
    if (opts.style) Object.keys(opts.style).forEach(key => this.renderer2.setStyle(el, key, opts.style[key]));
    return el;
  }

  buildCards(threeState: any): void {
    const objects: any[] = [];
    for (const cardData of this.CARD_DATA) {
      const el = this.createCardEl(cardData.title, cardData.meta, cardData.body, cardData.opts);
      this.renderer2.setAttribute(el, 'id', cardData.id);

      const obj = new THREE.CSS3DObject(el);
      const { scale } = cardData.layout;
      obj.scale.set(scale, scale, scale);
      (obj as any).cardData = cardData;

      threeState.root.add(obj);
      objects.push(obj);
    }
    threeState.objects = objects;
  }
}
