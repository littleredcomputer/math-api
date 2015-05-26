(ns net.littleredcomputer.math.examples.rigid-rotation
  (:refer-clojure :exclude [+ - * /])
  (:require [math.env :refer :all]
            [math.mechanics.rigid :refer [rigid-sysder]]))


(defn evolver
  [t dt A B C αDot0 βDot0 γDot0]
  (let [state-history (atom [])]
    ((evolve rigid-sysder
             A B C                                                ;; moments of inertia
             )
      (up 0.0
          (up 1 0 0)
          (up αDot0 βDot0 γDot0))
      (fn [t [_ [α β γ] _]] (swap! state-history conj [t α β γ]))
      dt
      t
      1.0e-6
      {:compile true})
    @state-history))

(def equations
  (simplify ((rigid-sysder 'A 'B 'C)
              (up 't
                  (up 'α 'β 'γ)
                  (up 'αdot 'βdot 'γdot)))))
