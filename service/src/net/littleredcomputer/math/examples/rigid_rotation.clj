(ns net.littleredcomputer.math.examples.rigid-rotation
  (:refer-clojure :exclude [+ - * /])
  (:require [math.env :refer :all]
            [math.mechanics.rigid :refer :all]
            [clojure.tools.logging :as log]))


(defn evolver
  [t dt A B C θ0 φ0 ψ0 θdot0 φdot0 ψdot0]
  (let [state-history (atom [])
        L (Euler-state->L-space A B C)]
    ((evolve rigid-sysder
             A B C                                                ;; moments of inertia
             )
      (up 0.0
          (up θ0 φ0 ψ0)
          (up θdot0 φdot0 ψdot0))
      (fn [t [_ [θ φ ψ] _ :as local]]
        (swap! state-history conj [t θ φ ψ (seq (L local))]))
      dt
      t
      1.0e-6
      {:compile true})
    @state-history))

;(def equations
;  (simplify ((rigid-sysder 'A 'B 'C)
;              (up 't
;                  (up 'θ 'φ 'ψ)
;                  (up 'θdot 'φdot 'ψdot)))))
