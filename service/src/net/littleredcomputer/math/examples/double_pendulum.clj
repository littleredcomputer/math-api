(ns net.littleredcomputer.math.examples.double-pendulum
  (:refer-clojure :exclude [+ - * /])
  (:require [math.env :refer :all]
            [math.mechanics.lagrange :refer :all]))

(defn- coords
  [l1 l2 θ φ]
  (let [x1 (* l1 (sin θ))
        y1 (- (* l1 (cos θ)))
        x2 (+ x1 (* l2 (sin φ)))
        y2 (- y1 (* l2 (cos φ)))]
    [x1 y1 x2 y2]))

(defn V-double-pend
  [m1 m2 l1 l2 g]
  (fn [[_ [θ φ] _]]
    (let [[_ y1 _ y2] (coords l1 l2 θ φ)]
      (+ (* m1 g y1)
         (* m2 g y2)))))

(defn T-double-pend
   [m1 m2 l1 l2 _]
   (fn [[_ [θ φ] [θdot φdot]]]
     (let [v1sq (* (square l1) (square θdot))
           v2sq (* (square l2) (square φdot))]
       (+ (* 1/2 m1 v1sq)
          (* 1/2 m2 (+ v1sq
                       v2sq
                       (* 2 l1 l2 θdot φdot (cos (- θ φ)))))))))

(def L-double-pend
   (- T-double-pend V-double-pend))

(defn- pend-state-derivative  [m1 m2 l1 l2 g]
   (Lagrangian->state-derivative
     (L-double-pend m1 m2 l1 l2 g)))

(defn evolve-double-pendulum
   [t g m1 l1 θ0 θdot0 m2 l2 φ0 φdot0]
   (let [state-history (atom [])]
     ((evolve pend-state-derivative
              m1 ;; mass of bob1
              m2 ;; mass of bob2
              l1 ;; length of rod1
              l2 ;; length of rod2
              g  ;; acceleration due to gravity
              )
       (up 0.0
           (up θ0 φ0)
           (up θdot0 φdot0))
       (fn [t [_ [θ φ] _]] (swap! state-history conj [t θ φ]))
       0.01
       t
       1.0e-6
       {:compile true})
     @state-history))


