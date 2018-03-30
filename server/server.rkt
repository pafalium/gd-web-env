#lang racket

(require rosetta/autocad-server)

(require json)

(require web-server/servlet
         web-server/servlet-env
         web-server/dispatch)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-syntax-rule
  (for-backends backends expr ...)
  (for ([backend (in-list backends)])
    #;(parameterize ((current-out-backend backend))
        expr ...)
    expr ...))

;(for-backends (list autocad sketchup)
;                (sphere))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define APPLICATION/JSON-MIME-TYPE #"application/json; charset=utf-8")
(define (response/jsexpr jsexpr
                         #:code [code 200]
                         #:message [message #"Okay"]
                         #:seconds [seconds (current-seconds)]
                         #:mime-type [mime-type APPLICATION/JSON-MIME-TYPE]
                         #:headers [headers '()])
  (response/full code message seconds mime-type
                 headers
                 (list (jsexpr->bytes jsexpr))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
;; json to rosetta
;;

(define (convert-xyz xyz-jsexpr)
  (vxyz (first xyz-jsexpr) (second xyz-jsexpr) (third xyz-jsexpr)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 
;; Store results of previous calls so they can be referenced in later
;;

(define next-shape-id 0)
(define (get-next-shape-id)
  (let ([id next-shape-id])
    (set! next-shape-id (+ next-shape-id 1))
    id))

(define shapes (make-hash))

(define (set-shape-for-backend shape-id shape [backend "autocad" #;(current-out-backend)])
  (hash-update! shapes shape-id
                (lambda (curr)
                  (hash-set! curr backend shape)
                  curr)
                (make-hash)))

(define (resolve-shape id-jsexpr)
  (let ([id-shapes (hash-ref shapes (hash-ref id-jsexpr 'id))])
    (hash-ref id-shapes "autocad" #;(current-out-backend))))

(define (clear-shapes)
  (hash-clear! shapes))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
;; Map URL paths to handler functions
;;

(define-values (dispatch url)
  (dispatch-rules
   [("corners-box") #:method "post" corners-box]
   [("right-cuboid") #:method "post" right-cuboid-handler]
   [("center-sphere") #:method "post" center-sphere]
   [("centers-cylinder") #:method "post" centers-cylinder]
   [("cone-frustum") #:method "post" cone-frustum-handler]
   [("polygon") #:method "post" polygon-handler]
   [("extrusion") #:method "post" extrusion-handler]
   [("move") #:method "post" move-handler]
   [("rotate") #:method "post" rotate-handler]
   [("erase-all") #:method "get" erase-all]
   [("active-backends") #:method "put" select-backends]
   [("json-shapes") #:method "post" json-shapes-handler]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define selected-backends '("autocad") #;(list autocad))
(define (str->backend str)
  str
  #;(case str
      [("autocad") autocad]
      [("sketchup") sketchup]
      [("rhino") rhino]
      [("revit") revit]))

(define (select-backends req)
  (let* ([req-json (bytes->jsexpr (request-post-data/raw req))]
         [backends-lst (hash-ref req-json 'backends)]
         [new-backends (map str->backend backends-lst)])
    (set! selected-backends new-backends)
    (response/jsexpr
     #hasheq((succeeded . #t)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (erase-all request)
  (for-backends selected-backends
                (delete-all-shapes))
  (clear-shapes)
  (response/jsexpr
   #hasheq((succeeded . #t))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
;; Helpers for geometric transformations that may be applied to many shapes
;;

(define (map-atoms fn lst)
  (cond ((null? lst) lst)
        ((list? lst) (map (lambda (el) (map-atoms fn el)) lst))
        (else (fn lst))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (move-multiple shape vec)
  (map-atoms (lambda (shape) (move shape vec)) shape))

(define (rotate-multiple shape ang p0 p1)
  (map-atoms (lambda (shape) (rotate shape ang p0 p1)) shape))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;;
;;
;; General procedure for these request handlers:
; - Parse request's json
; - Convert parsed json into Rosetta objects
; - Do operation in each backend
;   - Generate id for operation result
;   - Actually perform the operation
;   - Save results for future use
; - Generate response with id of the operation's result
;

(define (corners-box req)
  (let ([id (get-next-shape-id)])
    (let ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([p1 (convert-xyz (hash-ref req-json 'p1))]
            [p2 (convert-xyz (hash-ref req-json 'p2))])
        (for-backends selected-backends
                      (set-shape-for-backend id (box p1 p2)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (center-sphere req)
  (let ([id (get-next-shape-id)])
    (let ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([c (convert-xyz (hash-ref req-json 'center))]
            [radius (hash-ref req-json 'radius)])
        (for-backends selected-backends
                      (set-shape-for-backend id (sphere c radius)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (centers-cylinder req)
  (let ([id (get-next-shape-id)])
    (let ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([p1 (convert-xyz (hash-ref req-json 'p1))]
            [p2 (convert-xyz (hash-ref req-json 'p2))]
            [radius (hash-ref req-json 'radius)])
        (for-backends selected-backends
                      (set-shape-for-backend id (cylinder p1 radius p2)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (cone-frustum-handler req)
  (let ([id (get-next-shape-id)])
    (let ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([p1 (convert-xyz (hash-ref req-json 'p1))]
            [p2 (convert-xyz (hash-ref req-json 'p2))]
            [r1 (hash-ref req-json 'radBot)]
            [r2 (hash-ref req-json 'radTop)])
        (for-backends selected-backends
                      (set-shape-for-backend id (cone-frustum p1 r1 p2 r2)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (right-cuboid-handler req)
  (let ([id (get-next-shape-id)])
    (let  ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([p1 (convert-xyz (hash-ref req-json 'p1))]
            [p2 (convert-xyz (hash-ref req-json 'p2))]
            [width (hash-ref req-json 'width)]
            [height (hash-ref req-json 'height)])
        (for-backends selected-backends
                      (set-shape-for-backend id (right-cuboid p1 width height p2)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (polygon-handler req)
  (let ([id (get-next-shape-id)])
    (let  ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([ps (map convert-xyz (hash-ref req-json 'vertices))])
        (for-backends selected-backends
                      (set-shape-for-backend id (apply polygon ps)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (extrusion-handler req)
  (let ([id (get-next-shape-id)])
    (let  ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([vec (convert-xyz (hash-ref req-json 'vec))])
        (for-backends selected-backends
                      (set-shape-for-backend id (extrusion (resolve-shape (hash-ref req-json 'shape)) vec)))))
    (response/jsexpr
     (hasheq 'id id))))


(define (move-handler req)
  (let ([id (get-next-shape-id)])
    (let* ([req-json (bytes->jsexpr (request-post-data/raw req))]
           [vec (convert-xyz (hash-ref req-json 'vec))])
      (for-backends selected-backends
                    (set-shape-for-backend id (map-atoms (lambda (shape)
                                                           (move-multiple (resolve-shape shape) vec))
                                                         (hash-ref req-json 'shape)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (rotate-handler req)
  (let ([id (get-next-shape-id)])
    (let* ([req-json (bytes->jsexpr (request-post-data/raw req))]
           [ang (hash-ref req-json 'ang)]
           [p (convert-xyz (hash-ref req-json 'p))]
           [vec (convert-xyz (hash-ref req-json 'vec))])
      (for-backends selected-backends
                    (set-shape-for-backend id (map-atoms (lambda (shape) (rotate-multiple (resolve-shape shape)
                                                                                          ang p vec))
                                                         (hash-ref req-json 'shape)))))
    (response/jsexpr
     (hasheq 'id id))))


;; receives: a json array with the serialized results from a program
;; returns:  a json array with the ids of the created results
;;; TEMPORARY: traverse the serialized generating every shape
;;; TODO:      keep track of already generated shapes
;;; TODO:      set-shape-for-backend...
(define (json-shapes-handler req)
  (let* ([req-json (bytes->jsexpr (request-post-data/raw req))]
         [shapes (map realize-shape req-json)])
    ;; TODO return ids for created shapes
    (map (lambda (s) (get-next-shape-id)) shapes))
  (response/jsexpr
   (hasheq 'id 'null)))
    
(define (realize-shape json)
  (cond ((list? json) (map realize-shape json))
        ((rightCuboid? json) (realize-rightCuboid json))
        ((corners-box? json) (realize-corners-box json))
        ((cone-frustum? json) (realize-cone-frustum json))
        ((center-sphere? json) (realize-center-sphere json))
        ((centers-cylinder? json) (realize-centers-cylinder json))
        ((translate? json) (realize-translate json))
        ((rotate? json) (realize-rotate json))
        ((polygon? json) (realize-polygon json))
        ((extrusion? json) (realize-extrusion json))
        #;(())
        (else 'null)))


(define (type-equal? json-obj type)
  (equal? (hash-ref json-obj 'type) type))

(define (make-point json)
  (let ((x (hash-ref json 'x))
        (y (hash-ref json 'y))
        (z (hash-ref json 'z)))
    (vxyz x y z)))


(define (corners-box? json)
  (type-equal? json "cornersBox"))

(define (realize-corners-box json)
  (let ([p1 (make-point (hash-ref json 'p1))]
        [p2 (make-point (hash-ref json 'p2))])
    (box p1 p2)))


(define (rightCuboid? json)
  (type-equal? json "rightCuboid"))

(define (realize-rightCuboid json)
  (let ([p1 (make-point (hash-ref json 'p1))]
        [width (identity (hash-ref json 'width))]
        [height (identity (hash-ref json 'height))]
        [p2 (make-point (hash-ref json 'p2))])
    (right-cuboid p1 width height p2)))


(define (translate? json)
  (type-equal? json "move"))

(define (realize-translate json)
  (let ([shape (realize-shape (hash-ref json 'shape))]
        [vec (make-point (hash-ref json 'vec))])
    (move-multiple shape vec)))


(define (rotate? json)
  (type-equal? json "rotate"))

(define (realize-rotate json)
  (let ([shape (realize-shape (hash-ref json 'shape))]
        [ang (hash-ref json 'ang)]
        [p (make-point (hash-ref json 'p))]
        [vec (make-point (hash-ref json 'vec))])
    (rotate-multiple shape ang p vec)))


(define (cone-frustum? json)
  (type-equal? json "coneFrustum"))

(define (realize-cone-frustum json)
  (let ([p1 (make-point (hash-ref json 'p1))]
        [p2 (make-point (hash-ref json 'p2))]
        [r1 (hash-ref json 'radBot)]
        [r2 (hash-ref json 'radTop)])
    (cone-frustum p1 r1 p2 r2)))


(define (center-sphere? json)
  (type-equal? json "centerSphere"))

(define (realize-center-sphere json)
  (let ([c (make-point (hash-ref json 'center))]
        [r (hash-ref json 'radius)])
    (sphere c r)))


(define (centers-cylinder? json)
  (type-equal? json "centersCylinder"))

(define (realize-centers-cylinder json)
  (let ([p1 (make-point (hash-ref json 'p1))]
        [r (hash-ref json 'radius)]
        [p2 (make-point (hash-ref json 'p2))])
    (cylinder p1 r p2)))


(define (polygon? json)
  (type-equal? json "polygon"))

(define (realize-polygon json)
  (let ([verts (map make-point (hash-ref json 'vertices))])
    (apply polygon verts)))


(define (extrusion? json)
  (type-equal? json "extrusion"))

(define (realize-extrusion json)
  (let ([shape (realize-shape (hash-ref json 'shape))]
        [vec (make-point (hash-ref json 'vec))])
    (extrusion shape vec))) 

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
;; Start the servlet 
;;

(serve/servlet dispatch
               #:extra-files-paths (list (build-path 'same "../dist"))
               #:servlet-path "/"
               #:servlet-regexp #rx"")


