import FarmPage from "@/app/(app)/farm/page";

export default function HomePage() {
  const faqAndBreadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "ฝึกพิมพ์ดีดออนไลน์ฟรี (หน้าแรก)",
            "item": "https://pimwai.vercel.app"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "บทเรียนฝึกพิมพ์สัมผัส 10 นิ้ว",
            "item": "https://pimwai.vercel.app/lessons"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "ทดสอบความเร็วพิมพ์ดีด (WPM)",
            "item": "https://pimwai.vercel.app/tests"
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": "ตารางจัดอันดับคนพิมพ์เร็ว",
            "item": "https://pimwai.vercel.app/rankings"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "ฝึกพิมพ์ดีดอย่างไรให้พิมพ์เร็วขึ้น?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "เริ่มจากการฝึกวางนิ้วที่แป้นเหย้า (ฟ ห ก ด ่ า ส ว) โดยไม่มองแป้นพิมพ์ เน้นความแม่นยำ (Accuracy 95% ขึ้นไป) ก่อนความเร็ว และฝึกต่อเนื่องวันละ 15–20 นาทีเพื่อให้กล้ามเนื้อจดจำตำแหน่งแป้น (Muscle Memory)"
            }
          },
          {
            "@type": "Question",
            "name": "วิธีวางนิ้วพิมพ์สัมผัส 10 นิ้ว แป้นเหย้า (ฟ ห ก ด ่ า ส ว) ทำอย่างไร?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "มือซ้ายวางเรียงจากนิ้วก้อยถึงนิ้วชี้ที่แป้น ฟ ห ก ด (A S D F) และมือขวาวางเรียงจากนิ้วชี้ถึงนิ้วก้อยที่แป้น ไม้เอก (่) า ส ว (J K L ;) ส่วนนิ้วหัวแม่มือทั้งสองข้างวางที่แป้นเว้นวรรค (Spacebar)"
            }
          },
          {
            "@type": "Question",
            "name": "PIMWAI ใช้งานฟรีไหม ต้องสมัครสมาชิกหรือเปล่า?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ใช้งานฟรี 100% ไม่มีโฆษณาคั่น สามารถเริ่มฝึกพิมพ์ด่วนและทดสอบความเร็ว WPM ได้ทันทีโดยไม่ต้องล็อกอิน หรือหากเข้าสู่ระบบก็จะสามารถบันทึกสถิติ สะสม EXP และจัดอันดับแรงค์ข้ามอุปกรณ์ได้"
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqAndBreadcrumbJsonLd) }}
      />
      <FarmPage />
    </>
  );
}
