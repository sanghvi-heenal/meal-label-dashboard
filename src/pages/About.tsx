import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

const About = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 space-y-5 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> {t("common.back", "Back")}
      </button>

      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          <BookOpen size={12} /> Nutrition guide
        </div>
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          The Plate Method: how to start &amp; end every meal
        </h1>
        <p className="text-sm text-muted-foreground">
          A simple, research-backed way to build balanced meals that keep your energy steady
          and help you avoid the mid-afternoon sugar crash.
        </p>
      </header>

      <article className="card-surface space-y-4 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">What is the Plate Method?</h2>
          <p>
            Popularized by the U.S. Department of Agriculture (MyPlate) and the Diabetes Plate
            Method from the American Diabetes Association, the plate method is a visual guide
            to portioning a single meal — no counting, no weighing.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>½ plate:</strong> non-starchy vegetables (leafy greens, broccoli, peppers, cucumber, tomatoes).</li>
            <li><strong>¼ plate:</strong> lean protein (dal, tofu, paneer, eggs, fish, chicken, legumes).</li>
            <li><strong>¼ plate:</strong> quality carbs (whole grains, millets, brown rice, roti, sweet potato).</li>
            <li><strong>Add:</strong> a thumb of healthy fat (nuts, seeds, olive oil, ghee) and a glass of water.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">How to <em>start</em> a meal</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <strong>Water first.</strong> Drink 200–300 ml of water 10 minutes before eating —
              it primes digestion and reduces overeating.
            </li>
            <li>
              <strong>Veggies or fibre first.</strong> Eating vegetables or a small salad before
              carbs blunts the post-meal blood-sugar spike. This is often called <em>food
              sequencing</em> or the "veggies-first" rule.
            </li>
            <li>
              <strong>Then protein &amp; fat.</strong> Protein and healthy fat slow gastric
              emptying, so glucose enters the bloodstream more gradually.
            </li>
            <li>
              <strong>Carbs last.</strong> By the time you reach rice, roti or bread, your
              stomach is already partly full and the sugar response is much flatter.
            </li>
          </ol>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">How to <em>end</em> a meal</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <strong>Stop at 80% full.</strong> The Okinawan <em>hara hachi bu</em> practice —
              associated with longer lifespans — prevents the heavy, sleepy feeling of overeating.
            </li>
            <li>
              <strong>Move for 10 minutes.</strong> A short walk after eating lowers post-meal
              glucose by 12–22% in controlled studies. Even light activity beats sitting.
            </li>
            <li>
              <strong>Skip the sugary dessert on an empty stomach.</strong> If you want
              something sweet, have it right after the meal (not 2 hours later) — the fibre,
              fat and protein already on board flatten the spike.
            </li>
            <li>
              <strong>Herbal tea or water, not juice.</strong> Fruit juice and sodas cause the
              sharpest spikes; unsweetened tea (green, chamomile, mint) aids digestion.
            </li>
          </ol>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Why this prevents a sugar crash</h2>
          <p>
            A "sugar crash" (reactive hypoglycaemia) happens when a rapid glucose spike triggers
            an oversized insulin response, which then pulls blood sugar <em>below</em> baseline
            an hour or two later — the classic 3 pm slump. The plate method + food sequencing
            attack the problem at the source: they flatten the glucose curve so insulin never
            has to overshoot.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Research &amp; further reading</h2>
          <ul className="space-y-2">
            {[
              {
                title: "Shukla et al. (2015) — Food Order Has a Significant Impact on Postprandial Glucose and Insulin Levels",
                href: "https://diabetesjournals.org/care/article/38/7/e98/37561",
                source: "Diabetes Care (American Diabetes Association)",
              },
              {
                title: "Diabetes Plate Method — official guide",
                href: "https://diabetes.org/food-nutrition/meal-planning/diabetes-plate",
                source: "American Diabetes Association",
              },
              {
                title: "MyPlate — Build a Healthy Eating Routine",
                href: "https://www.myplate.gov/eat-healthy/what-is-myplate",
                source: "U.S. Department of Agriculture",
              },
              {
                title: "Reynolds et al. (2018) — Advice to walk after meals is more effective for lowering postprandial glycaemia",
                href: "https://link.springer.com/article/10.1007/s00125-016-4085-2",
                source: "Diabetologia",
              },
              {
                title: "Healthy Eating Plate",
                href: "https://www.hsph.harvard.edu/nutritionsource/healthy-eating-plate/",
                source: "Harvard T.H. Chan School of Public Health",
              },
            ].map((r) => (
              <li key={r.href}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 text-primary hover:underline"
                >
                  <ExternalLink size={14} className="mt-1 shrink-0" />
                  <span>
                    <span className="font-medium">{r.title}</span>
                    <span className="block text-xs text-muted-foreground">{r.source}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          Educational content only — not medical advice. If you have diabetes, PCOS, or another
          metabolic condition, please personalise this with your clinician or dietitian.
        </p>
      </article>
    </div>
  );
};

export default About;